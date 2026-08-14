import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { extname } from 'path';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../storage/storage.types';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const VERIFY_EMAIL_TTL_MS = 1000 * 60 * 60 * 48;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash,
        agencyName: dto.agencyName?.trim() || null,
        role: UserRole.CREATOR,
      },
    });

    try {
      await this.dispatchVerificationEmail(user);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        error instanceof Error ? error.stack : error,
      );
    }

    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.toAuthResponse(user);
  }

  /** Used by Google OAuth after find-or-create. */
  toAuthResponsePublic(user: User): AuthResponseDto {
    return this.toAuthResponse(user);
  }

  async me(userId: string): Promise<UserResponseDto> {
    return this.toUserResponse(await this.getUserOrThrow(userId));
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    await this.getUserOrThrow(userId);

    const data: {
      name?: string;
      bio?: string | null;
      agencyName?: string | null;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.bio !== undefined) {
      const bio = dto.bio.trim();
      data.bio = bio.length ? bio : null;
    }
    if (dto.agencyName !== undefined) {
      const agency = dto.agencyName.trim();
      data.agencyName = agency.length ? agency : null;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.toUserResponse(user);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const user = await this.getUserOrThrow(userId);

    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image');
    }
    if (file.size > AVATAR_MAX_BYTES) {
      throw new BadRequestException('Avatar must be 5MB or smaller');
    }

    const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
    const key = `avatars/${userId}/${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;

    const stored = await this.storage.upload({
      key,
      body: file.buffer,
      contentType: file.mimetype,
      contentLength: file.size,
    });

    const previousUrl = user.avatarUrl;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: stored.url },
    });

    if (previousUrl && this.storage.isManagedUrl(previousUrl)) {
      await this.storage.delete(previousUrl);
    }

    return this.toUserResponse(updated);
  }

  async removeAvatar(userId: string): Promise<UserResponseDto> {
    const user = await this.getUserOrThrow(userId);
    if (!user.avatarUrl) {
      return this.toUserResponse(user);
    }

    const previousUrl = user.avatarUrl;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    if (this.storage.isManagedUrl(previousUrl)) {
      await this.storage.delete(previousUrl);
    }

    return this.toUserResponse(updated);
  }

  async resendVerification(userId: string): Promise<MessageResponseDto> {
    const user = await this.getUserOrThrow(userId);
    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified.' };
    }

    await this.dispatchVerificationEmail(user);
    return { message: 'Verification email sent.' };
  }

  async verifyEmail(rawToken: string): Promise<UserResponseDto> {
    const tokenHash = this.hashToken(rawToken.trim());
    const record = await this.prisma.authToken.findUnique({
      where: { tokenHash },
    });

    if (
      !record ||
      record.type !== AuthTokenType.VERIFY_EMAIL ||
      record.usedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.authToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return this.toUserResponse(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    const generic: MessageResponseDto = {
      message:
        'If that email exists, we sent a password reset link. Check your inbox.',
    };

    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return generic;
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresMinutes = Number(
      this.config.get<string>('PASSWORD_RESET_EXPIRES_MINUTES') ?? '30',
    );
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.authToken.updateMany({
        where: {
          userId: user.id,
          type: AuthTokenType.RESET_PASSWORD,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      this.prisma.authToken.create({
        data: {
          userId: user.id,
          type: AuthTokenType.RESET_PASSWORD,
          tokenHash: this.hashToken(rawToken),
          expiresAt,
        },
      }),
    ]);

    const resetUrl = `${this.frontendBaseUrl()}/reset-password?token=${rawToken}`;

    try {
      await this.email.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (error) {
      this.logger.error(
        `Password reset email failed for ${user.email}`,
        error instanceof Error ? error.stack : error,
      );
    }

    return generic;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
    const tokenHash = this.hashToken(dto.token.trim());
    const record = await this.prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !record ||
      record.type !== AuthTokenType.RESET_PASSWORD ||
      record.usedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.authToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.authToken.updateMany({
        where: {
          userId: record.userId,
          type: AuthTokenType.RESET_PASSWORD,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password updated successfully. You can log in now.' };
  }

  private async dispatchVerificationEmail(user: User): Promise<void> {
    await this.prisma.authToken.updateMany({
      where: {
        userId: user.id,
        type: AuthTokenType.VERIFY_EMAIL,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFY_EMAIL_TTL_MS);

    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: AuthTokenType.VERIFY_EMAIL,
        tokenHash: this.hashToken(token),
        expiresAt,
      },
    });

    const verifyUrl = `${this.frontendBaseUrl()}/verify-email?token=${token}`;
    await this.email.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl,
    });
  }

  private frontendBaseUrl() {
    return (
      this.config.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async getUserOrThrow(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private toAuthResponse(user: User): AuthResponseDto {
    return {
      accessToken: this.jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bio: user.bio,
      agencyName: user.agencyName,
      avatarUrl: user.avatarUrl,
      emailVerified: Boolean(user.emailVerifiedAt),
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }
}
