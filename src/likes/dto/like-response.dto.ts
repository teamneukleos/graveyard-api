import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty()
  submissionId: string;

  @ApiProperty({ description: 'Whether the current user likes this submission' })
  liked: boolean;

  @ApiProperty({ description: 'Total likes on the submission' })
  likeCount: number;
}
