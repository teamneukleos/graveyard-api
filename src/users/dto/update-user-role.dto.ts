import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: [
      UserRole.CREATOR,
      UserRole.AGENCY,
      UserRole.JUDGE,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ],
    example: UserRole.JUDGE,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
