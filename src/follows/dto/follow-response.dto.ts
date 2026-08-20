import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class FollowResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ description: 'Whether the current user follows this profile' })
  following: boolean;

  @ApiProperty()
  followerCount: number;
}

export class PublicProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiPropertyOptional({ nullable: true })
  agencyName: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  followerCount: number;

  @ApiProperty()
  followingCount: number;

  @ApiProperty({
    description: 'Whether the authenticated viewer follows this profile (false if anonymous)',
  })
  viewerFollowing: boolean;
}
