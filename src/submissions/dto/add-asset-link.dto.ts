import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

/** External links — decks, Figma, Vimeo, Behance, etc. */
export class AddAssetLinkDto {
  @ApiProperty({
    enum: AssetType,
    example: AssetType.DECK,
    description: 'Use DECK/OTHER for presentation links; IMAGE/VIDEO/PDF also allowed for hosted URLs',
  })
  @IsEnum(AssetType)
  type: AssetType;

  @ApiProperty({ example: 'https://www.figma.com/proto/abc123' })
  @IsUrl({ require_protocol: true })
  url: string;

  @ApiPropertyOptional({ example: 'Campaign deck' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}
