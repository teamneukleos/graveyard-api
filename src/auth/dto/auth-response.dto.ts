import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class MemberAgencySummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  agencyName: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiPropertyOptional({ nullable: true })
  agencyName: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Whether the user has verified their email' })
  emailVerified: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'When the email was verified; null if still unverified',
  })
  emailVerifiedAt: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    type: MemberAgencySummaryDto,
    description: 'Agency this creator belongs to, if any',
  })
  memberOfAgency: MemberAgencySummaryDto | null;

  @ApiProperty({
    description:
      'True when an AGENCY account still needs to set agencyName (forced onboarding)',
  })
  agencyOnboardingRequired: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
