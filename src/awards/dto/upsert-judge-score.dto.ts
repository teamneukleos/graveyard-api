import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertJudgeScoreDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  submissionId: string;

  @ApiProperty({ minimum: 1, maximum: 10, example: 8 })
  @IsInt()
  @Min(1)
  @Max(10)
  concept: number;

  @ApiProperty({ minimum: 1, maximum: 10, example: 7 })
  @IsInt()
  @Min(1)
  @Max(10)
  craft: number;

  @ApiProperty({ minimum: 1, maximum: 10, example: 9 })
  @IsInt()
  @Min(1)
  @Max(10)
  story: number;

  @ApiProperty({ minimum: 1, maximum: 10, example: 8 })
  @IsInt()
  @Min(1)
  @Max(10)
  deservedLife: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
