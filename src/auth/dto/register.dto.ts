import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const REGISTER_ROLES = [UserRole.CREATOR, UserRole.AGENCY] as const;

export class RegisterDto {
  @ApiProperty({ example: 'ada@graveyard.work' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ada Okonkwo' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'SecurePass1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({
    enum: REGISTER_ROLES,
    default: UserRole.CREATOR,
    description: 'CREATOR (individual) or AGENCY account',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: (typeof REGISTER_ROLES)[number];

  @ApiPropertyOptional({ example: 'Night Market Studio' })
  @ValidateIf((dto: RegisterDto) => dto.role === UserRole.AGENCY)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  agencyName?: string;
}
