import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AwardPlacement } from '@prisma/client';

export class ScoreboardItemDto {
  @ApiProperty()
  submissionId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categorySlug: string;

  @ApiProperty()
  creatorName: string;

  @ApiProperty()
  scoreCount: number;

  @ApiProperty({ description: 'Average of judge totals' })
  averageTotal: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Existing published placement for this cycle, if any',
    enum: AwardPlacement,
  })
  placement: AwardPlacement | null;
}

export class AwardResultItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  awardCycleId: string;

  @ApiProperty()
  cycleName: string;

  @ApiProperty()
  cycleYear: number;

  @ApiProperty()
  submissionId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categorySlug: string;

  @ApiProperty()
  categoryName: string;

  @ApiProperty({ enum: AwardPlacement })
  placement: AwardPlacement;

  @ApiProperty()
  creatorName: string;

  @ApiPropertyOptional({ nullable: true })
  agencyName: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverUrl: string | null;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  publishedAt: Date;
}

export class PublishResultsResponseDto {
  @ApiProperty()
  published: number;

  @ApiProperty({ type: [AwardResultItemDto] })
  results: AwardResultItemDto[];

  @ApiPropertyOptional({
    description: 'Cycle status after publish',
  })
  cycleStatus?: string;
}
