import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LikeResponseDto } from './dto/like-response.dto';
import { LikesService } from './likes.service';

@ApiTags('likes')
@Controller('submissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a published submission' })
  @ApiOkResponse({ type: LikeResponseDto })
  @ApiUnauthorizedResponse()
  like(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<LikeResponseDto> {
    return this.likesService.like(user.id, id);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Remove like from a submission' })
  @ApiOkResponse({ type: LikeResponseDto })
  @ApiUnauthorizedResponse()
  unlike(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<LikeResponseDto> {
    return this.likesService.unlike(user.id, id);
  }
}
