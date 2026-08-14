import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class AdminBulkSubmissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  ids: string[];

  @ApiProperty({
    enum: ['publish', 'unpublish', 'winners', 'shortlist', 'enter_judging'],
  })
  @IsIn(['publish', 'unpublish', 'winners', 'shortlist', 'enter_judging'])
  action: 'publish' | 'unpublish' | 'winners' | 'shortlist' | 'enter_judging';

  @ApiPropertyOptional({
    description: 'Award cycle id for winners/shortlist/enter_judging',
  })
  @IsOptional()
  @IsString()
  cycleId?: string;

  @ApiPropertyOptional({
    description: 'When publishing winners/shortlist, mark cycle results published',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  markCyclePublished?: boolean;
}
