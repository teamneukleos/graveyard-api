import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class EnterOwnSubmissionDto {
  @ApiProperty({ description: 'Published submission id owned by the current user' })
  @IsString()
  @MinLength(1)
  submissionId: string;
}
