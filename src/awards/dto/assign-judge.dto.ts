import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AssignJudgeDto {
  @ApiProperty({ description: 'User id to assign as a judge for this cycle' })
  @IsString()
  @MinLength(1)
  userId: string;
}
