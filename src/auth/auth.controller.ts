import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  type AuthUser,
} from './decorators/current-user.decorator';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthService } from './google-auth.service';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new creator account' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  me(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    return this.authService.me(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse()
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload or replace profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.authService.uploadAvatar(user.id, file);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove profile picture' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse()
  removeAvatar(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    return this.authService.removeAvatar(user.id);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiUnauthorizedResponse()
  resendVerification(
    @CurrentUser() user: AuthUser,
  ): Promise<MessageResponseDto> {
    return this.authService.resendVerification(user.id);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with a confirmation token' })
  @ApiOkResponse({ type: UserResponseDto })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<UserResponseDto> {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiOkResponse({ type: MessageResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with a token from email' })
  @ApiOkResponse({ type: MessageResponseDto })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
    return this.authService.resetPassword(dto);
  }

  @Get('google')
  @ApiOperation({ summary: 'Start Google OAuth sign-in (redirect)' })
  @ApiQuery({
    name: 'next',
    required: false,
    description: 'Frontend path to return to after login',
  })
  googleStart(@Query('next') next: string | undefined, @Res() res: Response) {
    const url = this.googleAuth.getAuthorizationUrl(next);
    return res.redirect(url);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback (redirect to frontend)' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    if (error) {
      return res.redirect(
        this.googleAuth.frontendErrorUrl(
          error === 'access_denied'
            ? 'Google sign-in was cancelled.'
            : 'Google sign-in failed.',
        ),
      );
    }

    try {
      const result = await this.googleAuth.handleCallback(code, state);
      return res.redirect(
        this.googleAuth.frontendCallbackUrl(result.accessToken, result.next),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed.';
      return res.redirect(this.googleAuth.frontendErrorUrl(message));
    }
  }
}
