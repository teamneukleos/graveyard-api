import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class AdminUpdateSubmissionDto {
  @ApiPropertyOptional({ enum: SubmissionStatus })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;
}
