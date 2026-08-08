import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class EnterSubmissionsDto {
  @ApiProperty({
    type: [String],
    description: 'Published submission ids to move into UNDER_REVIEW',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsString({ each: true })
  submissionIds: string[];
}
