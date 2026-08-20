import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardWindowDto {
  @ApiProperty({ description: 'Week start (Monday 00:00 UTC, inclusive)' })
  startsAt: Date;

  @ApiProperty({ description: 'Week end (next Monday 00:00 UTC, exclusive)' })
  endsAt: Date;
}

export class WorkLeaderboardItemDto {
  @ApiProperty()
  rank: number;

  @ApiProperty({ description: 'Weighted points received during this week window' })
  weeklyLikes: number;

  @ApiProperty()
  submissionId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  voteScore: number;

  @ApiPropertyOptional({ nullable: true })
  coverUrl: string | null;

  @ApiProperty()
  categorySlug: string;

  @ApiProperty()
  creatorId: string;

  @ApiProperty()
  creatorName: string;

  @ApiPropertyOptional({ nullable: true })
  agencyName: string | null;

  @ApiPropertyOptional()
  creatorRole?: string;
}

export class CreatorLeaderboardItemDto {
  @ApiProperty()
  rank: number;

  @ApiProperty({ description: 'Likes received on their work this week' })
  weeklyLikes: number;

  @ApiProperty()
  creatorId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  agencyName: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Distinct submissions that received likes this week' })
  likedSubmissions: number;
}

export class WorksLeaderboardResponseDto {
  @ApiProperty({ type: LeaderboardWindowDto })
  window: LeaderboardWindowDto;

  @ApiProperty({ type: [WorkLeaderboardItemDto] })
  items: WorkLeaderboardItemDto[];
}

export class CreatorsLeaderboardResponseDto {
  @ApiProperty({ type: LeaderboardWindowDto })
  window: LeaderboardWindowDto;

  @ApiProperty({ type: [CreatorLeaderboardItemDto] })
  items: CreatorLeaderboardItemDto[];
}
