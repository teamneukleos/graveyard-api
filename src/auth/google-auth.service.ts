import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

type OAuthState = {
  next: string;
  exp: number;
  nonce: string;
};

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly oauthClient: OAuth2Client | null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
    const callbackUrl = this.config.get<string>('GOOGLE_CALLBACK_URL')?.trim();

    this.oauthClient =
      clientId && clientSecret && callbackUrl
        ? new OAuth2Client(clientId, clientSecret, callbackUrl)
        : null;

    if (!this.oauthClient) {
      this.logger.warn(
        'Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL)',
      );
    }
  }

  isConfigured() {
    return Boolean(this.oauthClient);
  }

  getAuthorizationUrl(nextPath?: string): string {
    if (!this.oauthClient) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    const state = this.signState({
      next: this.sanitizeNext(nextPath),
      exp: Date.now() + 10 * 60 * 1000,
      nonce: randomBytes(8).toString('hex'),
    });

    return this.oauthClient.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
    });
  }

  async handleCallback(
    code: string | undefined,
    state: string | undefined,
  ): Promise<{ accessToken: string; next: string }> {
    if (!this.oauthClient) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    if (!code?.trim()) {
      throw new BadRequestException('Missing Google authorization code');
    }

    const parsedState = this.verifyState(state);
    const { tokens } = await this.oauthClient.getToken(code.trim());
    if (!tokens.id_token) {
      throw new UnauthorizedException('Google did not return an ID token');
    }

    const ticket = await this.oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Google account is missing email');
    }
    if (payload.email_verified === false) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const user = await this.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name?.trim() || payload.email.split('@')[0] || 'Creator',
      avatarUrl: payload.picture || null,
    });

    const auth = this.authService.toAuthResponsePublic(user);
    return { accessToken: auth.accessToken, next: parsedState.next };
  }

  frontendCallbackUrl(accessToken: string, next: string) {
    const base = (
      this.config.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:3001'
    ).replace(/\/$/, '');
    const url = new URL(`${base}/api/auth/google/callback`);
    url.searchParams.set('token', accessToken);
    if (next && next !== '/portal') {
      url.searchParams.set('next', next);
    }
    return url.toString();
  }

  frontendErrorUrl(message: string) {
    const base = (
      this.config.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:3001'
    ).replace(/\/$/, '');
    const url = new URL(`${base}/login`);
    url.searchParams.set('error', 'google');
    url.searchParams.set('message', message.slice(0, 180));
    return url.toString();
  }

  private async findOrCreateGoogleUser(input: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }): Promise<User> {
    const byGoogle = await this.prisma.user.findUnique({
      where: { googleId: input.googleId },
    });
    if (byGoogle) {
      return byGoogle;
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== input.googleId) {
        throw new UnauthorizedException(
          'This email is linked to a different Google account',
        );
      }
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: input.googleId,
          emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
          avatarUrl: byEmail.avatarUrl || input.avatarUrl,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        googleId: input.googleId,
        passwordHash: null,
        avatarUrl: input.avatarUrl,
        emailVerifiedAt: new Date(),
        role: UserRole.CREATOR,
      },
    });
  }

  private sanitizeNext(nextPath?: string) {
    if (!nextPath) return '/portal';
    const trimmed = nextPath.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
      return '/portal';
    }
    return trimmed.slice(0, 200);
  }

  private stateSecret() {
    return (
      this.config.get<string>('GOOGLE_OAUTH_STATE_SECRET')?.trim() ||
      this.config.getOrThrow<string>('JWT_SECRET')
    );
  }

  private signState(payload: OAuthState) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', this.stateSecret())
      .update(body)
      .digest('base64url');
    return `${body}.${sig}`;
  }

  private verifyState(state: string | undefined): OAuthState {
    if (!state?.includes('.')) {
      throw new BadRequestException('Invalid OAuth state');
    }
    const [body, sig] = state.split('.');
    const expected = createHmac('sha256', this.stateSecret())
      .update(body)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Invalid OAuth state');
    }

    let parsed: OAuthState;
    try {
      parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }

    if (!parsed?.exp || parsed.exp < Date.now()) {
      throw new BadRequestException('OAuth state expired');
    }

    return {
      next: this.sanitizeNext(parsed.next),
      exp: parsed.exp,
      nonce: parsed.nonce || '',
    };
  }
}
