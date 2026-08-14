import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsStatusCountDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  total: number;
}

export class AnalyticsCategoryCountDto {
  @ApiProperty()
  category: string;

  @ApiProperty()
  total: number;
}

export class AnalyticsDayCountDto {
  @ApiProperty({ example: '2026-08-14' })
  day: string;

  @ApiProperty()
  total: number;
}

export class AnalyticsEventFillDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  rsvps: number;

  @ApiProperty()
  capacity: number;

  @ApiProperty({ description: 'Confirmed RSVPs as percent of capacity' })
  fill: number;
}

export class AnalyticsJudgeStatDto {
  @ApiProperty()
  judgeName: string;

  @ApiProperty()
  reviews: number;
}

export class AnalyticsJudgeCoverageDto {
  @ApiProperty({ description: 'Reviewable submissions with at least one score' })
  covered: number;

  @ApiProperty({ description: 'Submissions currently under review' })
  reviewable: number;

  @ApiProperty()
  percent: number;

  @ApiProperty({ type: AnalyticsJudgeStatDto, isArray: true })
  judges: AnalyticsJudgeStatDto[];
}

export class AnalyticsFunnelDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  published: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { DRAFT: 2, PUBLISHED: 5 },
  })
  byStatus: Record<string, number>;
}

export class AnalyticsTotalsDto {
  @ApiProperty({ description: 'Total likes (community votes)' })
  votes: number;

  @ApiProperty({ description: 'Total confirmed event RSVPs' })
  rsvps: number;
}

export class AdminAnalyticsResponseDto {
  @ApiProperty({ type: AnalyticsStatusCountDto, isArray: true })
  submissionsByStatus: AnalyticsStatusCountDto[];

  @ApiProperty()
  votesLast7Days: number;

  @ApiProperty()
  rsvpsLast7Days: number;

  @ApiProperty({ type: AnalyticsJudgeCoverageDto })
  judgeCoverage: AnalyticsJudgeCoverageDto;

  @ApiProperty({ type: AnalyticsCategoryCountDto, isArray: true })
  topCategories: AnalyticsCategoryCountDto[];

  @ApiProperty({ type: AnalyticsCategoryCountDto, isArray: true })
  byCategory: AnalyticsCategoryCountDto[];

  @ApiProperty({ type: AnalyticsDayCountDto, isArray: true })
  votesOverTime: AnalyticsDayCountDto[];

  @ApiProperty({ type: AnalyticsEventFillDto, isArray: true })
  eventFill: AnalyticsEventFillDto[];

  @ApiProperty({ type: AnalyticsFunnelDto })
  funnel: AnalyticsFunnelDto;

  @ApiProperty({ type: AnalyticsTotalsDto })
  totals: AnalyticsTotalsDto;
}
