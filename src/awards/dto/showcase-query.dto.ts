import { ApiPropertyOptional } from '@nestjs/swagger';
import { AwardPlacement } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ShowcaseQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Category slug' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: AwardPlacement })
  @IsOptional()
  @IsEnum(AwardPlacement)
  placement?: AwardPlacement;

  @ApiPropertyOptional({ description: 'Filter to a specific award cycle id' })
  @IsOptional()
  @IsString()
  cycleId?: string;
}
