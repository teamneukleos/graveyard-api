import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../storage/storage.types';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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

    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

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
      createdAt: user.createdAt,
    };
  }
}
