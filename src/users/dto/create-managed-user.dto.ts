import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const MANAGED_ROLES = [UserRole.ADMIN, UserRole.JUDGE] as const;

export class CreateManagedUserDto {
  @ApiProperty({ example: 'judge@graveyard.work' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jordan Judge' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'SecurePass1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ enum: MANAGED_ROLES })
  @IsIn(MANAGED_ROLES)
  role: (typeof MANAGED_ROLES)[number];

  @ApiPropertyOptional({ example: 'Night Market Studio' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  agencyName?: string;
}
