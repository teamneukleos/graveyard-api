import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import {
  FollowResponseDto,
  PublicProfileDto,
} from './dto/follow-response.dto';
import { FollowsService } from './follows.service';

@ApiTags('follows')
@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get(':id/profile')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Public creator/agency profile summary',
    description: 'Includes follower counts and whether the viewer follows them.',
  })
  @ApiOkResponse({ type: PublicProfileDto })
  getProfile(
    @Param('id') id: string,
    @CurrentUser() viewer?: AuthUser | null,
  ): Promise<PublicProfileDto> {
    return this.followsService.getPublicProfile(id, viewer?.id);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a creator or agency' })
  @ApiOkResponse({ type: FollowResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  follow(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<FollowResponseDto> {
    return this.followsService.follow(user.id, id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a creator or agency' })
  @ApiOkResponse({ type: FollowResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  unfollow(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<FollowResponseDto> {
    return this.followsService.unfollow(user.id, id);
  }
}
