import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AwardPlacement } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PublishResultItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  submissionId: string;

  @ApiProperty({ enum: AwardPlacement, example: AwardPlacement.SHORTLISTED })
  @IsEnum(AwardPlacement)
  placement: AwardPlacement;
}

export class PublishResultsDto {
  @ApiProperty({ type: [PublishResultItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PublishResultItemDto)
  results: PublishResultItemDto[];

  @ApiPropertyOptional({
    default: true,
    description:
      'When true and cycle is JUDGING, move cycle status to RESULTS_PUBLISHED',
  })
  @IsOptional()
  @IsBoolean()
  markCyclePublished?: boolean;
}
