import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty()
  submissionId: string;

  @ApiProperty({ description: 'Whether the current user likes this submission' })
  liked: boolean;

  @ApiProperty({ description: 'Number of distinct voters' })
  likeCount: number;

  @ApiProperty({
    description: 'Weighted vote score (creator 1 / agency 3 / judge 5)',
  })
  voteScore: number;
}
