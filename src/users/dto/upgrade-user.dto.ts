import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsIn } from 'class-validator';

const UPGRADE_ROLES = [UserRole.JUDGE, UserRole.ADMIN] as const;

export class UpgradeUserDto {
  @ApiProperty({ example: 'creator@graveyard.work' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UPGRADE_ROLES, example: UserRole.JUDGE })
  @IsIn(UPGRADE_ROLES)
  role: (typeof UPGRADE_ROLES)[number];
}
