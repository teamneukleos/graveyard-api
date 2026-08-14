import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpgradeUserDto } from './dto/upgrade-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    role?: UserRole;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 50));
    const q = params.q?.trim();

    const where = {
      ...(params.role ? { role: params.role } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: users.map((user) => this.toUserResponse(user)),
      total,
      page,
      limit,
    };
  }

  async createManaged(dto: CreateManagedUserDto): Promise<UserResponseDto> {
    if (dto.role !== UserRole.ADMIN && dto.role !== UserRole.JUDGE) {
      throw new BadRequestException('Managed users must be ADMIN or JUDGE');
    }

    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(
        'Email is already registered. Use upgrade instead.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash,
        agencyName: dto.agencyName?.trim() || null,
        role: dto.role,
      },
    });

    return this.toUserResponse(user);
  }

  async upgradeByEmail(dto: UpgradeUserDto): Promise<UserResponseDto> {
    if (dto.role !== UserRole.ADMIN && dto.role !== UserRole.JUDGE) {
      throw new BadRequestException('Can only upgrade to ADMIN or JUDGE');
    }

    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.applyRole(user, dto.role);
  }

  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    actorId: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      user.id === actorId &&
      user.role === UserRole.SUPER_ADMIN &&
      dto.role !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException(
        'You cannot remove your own super admin role',
      );
    }

    if (
      user.id === actorId &&
      user.role === UserRole.ADMIN &&
      dto.role !== UserRole.ADMIN &&
      dto.role !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException('You cannot remove your own admin role');
    }

    return this.applyRole(user, dto.role);
  }

  private async applyRole(
    user: User,
    role: UserRole,
  ): Promise<UserResponseDto> {
    if (user.role === role) {
      return this.toUserResponse(user);
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { role },
    });

    return this.toUserResponse(updated);
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
