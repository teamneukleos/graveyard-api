import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubmitterType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AssetDto } from './asset.dto';
import { TeamMemberDto } from './team-member.dto';

export class UpdateSubmissionDto {
  @ApiPropertyOptional({ example: 'The Midnight Bus Campaign' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: SubmitterType })
  @IsOptional()
  @IsEnum(SubmitterType)
  submitterType?: SubmitterType;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  yearCreated?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  concept?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  whyNeverLived?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rightsAttested?: boolean;

  @ApiPropertyOptional({
    type: [TeamMemberDto],
    description: 'Replaces all team members when provided',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  teamMembers?: TeamMemberDto[];

  @ApiPropertyOptional({
    type: [AssetDto],
    description: 'Replaces all assets when provided',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  assets?: AssetDto[];
}
