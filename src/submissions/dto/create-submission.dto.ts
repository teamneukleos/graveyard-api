import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateSubmissionDto {
  @ApiProperty({ example: 'The Midnight Bus Campaign' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({
    enum: SubmitterType,
    default: SubmitterType.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(SubmitterType)
  submitterType?: SubmitterType;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  yearCreated: number;

  @ApiProperty({
    example: 'A campaign about late-night workers finding community on the bus.',
    description:
      'May be short while drafting. Publish requires at least 20 characters.',
  })
  @IsString()
  @MinLength(0)
  @MaxLength(10000)
  concept: string;

  @ApiProperty({
    example: 'Client paused the brief after a leadership change.',
    description:
      'May be short while drafting. Publish requires at least 10 characters.',
  })
  @IsString()
  @MinLength(0)
  @MaxLength(5000)
  whyNeverLived: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rightsAttested?: boolean;

  @ApiPropertyOptional({ type: [TeamMemberDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  teamMembers?: TeamMemberDto[];

  @ApiPropertyOptional({ type: [AssetDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  assets?: AssetDto[];
}
