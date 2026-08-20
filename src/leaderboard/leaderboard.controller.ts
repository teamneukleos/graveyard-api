import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import {
  CreatorsLeaderboardResponseDto,
  WorksLeaderboardResponseDto,
} from './dto/leaderboard-response.dto';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('works')
  @ApiOperation({
    summary: 'Weekly most-appreciated works',
    description:
      'Ranks published submissions by likes received since Monday 00:00 UTC.',
  })
  @ApiOkResponse({ type: WorksLeaderboardResponseDto })
  works(
    @Query() query: LeaderboardQueryDto,
  ): Promise<WorksLeaderboardResponseDto> {
    return this.leaderboardService.works(query.limit ?? 20);
  }

  @Get('creators')
  @ApiOperation({
    summary: 'Weekly rising creators',
    description:
      'Ranks individual creators (role CREATOR) by weighted votes their published work received since Monday 00:00 UTC.',
  })
  @ApiOkResponse({ type: CreatorsLeaderboardResponseDto })
  creators(
    @Query() query: LeaderboardQueryDto,
  ): Promise<CreatorsLeaderboardResponseDto> {
    return this.leaderboardService.creators(query.limit ?? 20);
  }

  @Get('agencies')
  @ApiOperation({
    summary: 'Weekly rising agencies',
    description:
      'Ranks agency accounts by weighted votes their published work received since Monday 00:00 UTC.',
  })
  @ApiOkResponse({ type: CreatorsLeaderboardResponseDto })
  agencies(
    @Query() query: LeaderboardQueryDto,
  ): Promise<CreatorsLeaderboardResponseDto> {
    return this.leaderboardService.agencies(query.limit ?? 20);
  }
}
