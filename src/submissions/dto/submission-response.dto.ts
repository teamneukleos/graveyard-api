import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType, SubmissionStatus, SubmitterType } from '@prisma/client';

export class SubmissionTeamMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  roleTitle: string | null;

  @ApiProperty()
  sortOrder: number;
}

export class SubmissionAssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AssetType })
  type: AssetType;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional({ nullable: true })
  fileName: string | null;

  @ApiPropertyOptional({ nullable: true })
  mimeType: string | null;

  @ApiPropertyOptional({ nullable: true })
  sizeBytes: number | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isCover: boolean;
}

export class SubmissionCreatorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  agencyName: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;

  @ApiPropertyOptional()
  role?: string;

  @ApiPropertyOptional({ nullable: true })
  memberOfAgency?: {
    id: string;
    name: string;
    agencyName: string | null;
  } | null;
}

export class SubmissionCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class SubmissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: SubmitterType })
  submitterType: SubmitterType;

  @ApiProperty()
  yearCreated: number;

  @ApiProperty()
  concept: string;

  @ApiProperty()
  whyNeverLived: string;

  @ApiProperty()
  rightsAttested: boolean;

  @ApiProperty({ enum: SubmissionStatus })
  status: SubmissionStatus;

  @ApiProperty()
  likeCount: number;

  @ApiProperty({ description: 'Weighted vote score' })
  voteScore: number;

  @ApiPropertyOptional({ nullable: true })
  publishedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: SubmissionCategoryResponseDto })
  category: SubmissionCategoryResponseDto;

  @ApiProperty({ type: SubmissionCreatorResponseDto })
  creator: SubmissionCreatorResponseDto;

  @ApiProperty({ type: [SubmissionTeamMemberResponseDto] })
  teamMembers: SubmissionTeamMemberResponseDto[];

  @ApiProperty({ type: [SubmissionAssetResponseDto] })
  assets: SubmissionAssetResponseDto[];
}

export class PaginatedSubmissionsResponseDto {
  @ApiProperty({ type: [SubmissionResponseDto] })
  data: SubmissionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
