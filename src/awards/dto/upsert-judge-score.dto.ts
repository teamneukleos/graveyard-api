import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpsertJudgeScoreDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  submissionId: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 10,
    description:
      'Single overall score (1–10). When set, fills concept/craft/story/deservedLife.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  overall?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, example: 8 })
  @ValidateIf((o: UpsertJudgeScoreDto) => o.overall == null)
  @IsInt()
  @Min(1)
  @Max(10)
  concept?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, example: 7 })
  @ValidateIf((o: UpsertJudgeScoreDto) => o.overall == null)
  @IsInt()
  @Min(1)
  @Max(10)
  craft?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, example: 9 })
  @ValidateIf((o: UpsertJudgeScoreDto) => o.overall == null)
  @IsInt()
  @Min(1)
  @Max(10)
  story?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, example: 8 })
  @ValidateIf((o: UpsertJudgeScoreDto) => o.overall == null)
  @IsInt()
  @Min(1)
  @Max(10)
  deservedLife?: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
