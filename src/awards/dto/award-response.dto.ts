import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AwardCycleStatus } from '@prisma/client';

export class AwardCycleJudgeDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  assignedAt: Date;
}

export class AwardCycleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  startsAt: Date;

  @ApiPropertyOptional({ nullable: true })
  endsAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  judgingEndsAt: Date | null;

  @ApiProperty({ enum: AwardCycleStatus })
  status: AwardCycleStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [AwardCycleJudgeDto] })
  judges?: AwardCycleJudgeDto[];

  @ApiPropertyOptional()
  judgeCount?: number;

  @ApiPropertyOptional()
  scoreCount?: number;
}

export class JudgeQueueItemDto {
  @ApiProperty()
  submissionId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  yearCreated: number;

  @ApiProperty()
  categorySlug: string;

  @ApiProperty()
  creatorName: string;

  @ApiPropertyOptional({ nullable: true })
  coverUrl: string | null;

  @ApiProperty({ description: 'Whether the current judge already scored this' })
  scoredByMe: boolean;

  @ApiPropertyOptional({ nullable: true })
  myTotal: number | null;
}

export class JudgeScoreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  awardCycleId: string;

  @ApiProperty()
  submissionId: string;

  @ApiProperty()
  judgeId: string;

  @ApiProperty()
  concept: number;

  @ApiProperty()
  craft: number;

  @ApiProperty()
  story: number;

  @ApiProperty()
  deservedLife: number;

  @ApiProperty()
  total: number;

  @ApiPropertyOptional({ nullable: true })
  comment: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EnterSubmissionsResponseDto {
  @ApiProperty()
  entered: number;

  @ApiProperty({ type: [String] })
  submissionIds: string[];
}

export class AwardEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  awardCycleId: string;

  @ApiProperty()
  submissionId: string;

  @ApiProperty()
  enteredById: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  cycleName?: string;

  @ApiPropertyOptional()
  cycleYear?: number;

  @ApiPropertyOptional()
  cycleStatus?: AwardCycleStatus;

  @ApiPropertyOptional()
  submissionTitle?: string;
}
