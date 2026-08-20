import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  FollowResponseDto,
  PublicProfileDto,
} from './dto/follow-response.dto';

const FOLLOWABLE_ROLES: UserRole[] = [UserRole.CREATOR, UserRole.AGENCY];

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(
    followerId: string,
    followingId: string,
  ): Promise<FollowResponseDto> {
    await this.requireVerifiedFollower(followerId);
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const target = await this.requireFollowableUser(followingId);

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!existing) {
      await this.prisma.follow.create({
        data: { followerId, followingId },
      });
    }

    const followerCount = await this.prisma.follow.count({
      where: { followingId },
    });

    return {
      userId: target.id,
      following: true,
      followerCount,
    };
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowResponseDto> {
    await this.requireVerifiedFollower(followerId);
    await this.requireFollowableUser(followingId);

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      await this.prisma.follow.delete({ where: { id: existing.id } });
    }

    const followerCount = await this.prisma.follow.count({
      where: { followingId },
    });

    return {
      userId: followingId,
      following: false,
      followerCount,
    };
  }

  async getPublicProfile(
    userId: string,
    viewerId?: string | null,
  ): Promise<PublicProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        agencyName: true,
        bio: true,
        avatarUrl: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user || !FOLLOWABLE_ROLES.includes(user.role)) {
      throw new NotFoundException('Profile not found');
    }

    let viewerFollowing = false;
    if (viewerId) {
      const link = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: userId,
          },
        },
        select: { id: true },
      });
      viewerFollowing = Boolean(link);
    }

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      agencyName: user.agencyName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      viewerFollowing,
    };
  }

  private async requireVerifiedFollower(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true, role: true, agencyName: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Verify your email to follow profiles');
    }
    if (user.role === UserRole.AGENCY && !user.agencyName?.trim()) {
      throw new ForbiddenException('Complete agency onboarding to follow profiles');
    }
  }

  private async requireFollowableUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user || !FOLLOWABLE_ROLES.includes(user.role)) {
      throw new NotFoundException('Profile not found');
    }
    return user;
  }
}
