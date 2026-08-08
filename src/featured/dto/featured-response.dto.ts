import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeaturedSubmissionSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  likeCount: number;

  @ApiPropertyOptional({ nullable: true })
  coverUrl: string | null;

  @ApiProperty()
  categorySlug: string;

  @ApiProperty()
  creatorName: string;

  @ApiPropertyOptional({ nullable: true })
  agencyName: string | null;
}

export class FeaturedItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  title: string | null;

  @ApiProperty()
  startsAt: Date;

  @ApiPropertyOptional({ nullable: true })
  endsAt: Date | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: FeaturedSubmissionSummaryDto })
  submission: FeaturedSubmissionSummaryDto;
}
