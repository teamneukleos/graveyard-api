import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventFormat, EventType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Yard Salon: Should Have Gone Live' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({ enum: EventFormat })
  @IsEnum(EventFormat)
  format: EventFormat;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  city: string;

  @ApiProperty({ example: 'Nike Art Gallery, Lekki' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  venue: string;

  @ApiProperty({ example: '2026-09-01T18:00:00+01:00' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: 40, minimum: 1 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 'Creators unpack shelved campaigns over small chops.' })
  @IsString()
  @MinLength(4)
  @MaxLength(1000)
  blurb: string;

  @ApiPropertyOptional({
    description: 'Optional slug; defaults to a unique slug from the title',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;
}
