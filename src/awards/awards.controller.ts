import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AwardsService } from './awards.service';
import { AssignJudgeDto } from './dto/assign-judge.dto';
import { CreateAwardCycleDto } from './dto/create-award-cycle.dto';
import { EnterOwnSubmissionDto } from './dto/enter-own-submission.dto';
import { EnterSubmissionsDto } from './dto/enter-submissions.dto';
import { PublishResultsDto } from './dto/publish-results.dto';
import {
  AwardCycleResponseDto,
  AwardEntryResponseDto,
  EnterSubmissionsResponseDto,
  JudgeQueueItemDto,
  JudgeScoreResponseDto,
} from './dto/award-response.dto';
import {
  AwardResultItemDto,
  PublishResultsResponseDto,
  ScoreboardItemDto,
} from './dto/result-response.dto';
import { UpdateAwardCycleDto } from './dto/update-award-cycle.dto';
import { UpsertJudgeScoreDto } from './dto/upsert-judge-score.dto';

@ApiTags('awards')
@Controller('award-cycles')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Get()
  @ApiOperation({ summary: 'List award cycles' })
  @ApiOkResponse({ type: AwardCycleResponseDto, isArray: true })
  list(): Promise<AwardCycleResponseDto[]> {
    return this.awardsService.listCycles();
  }

  @Get('open')
  @ApiOperation({
    summary: 'List award cycles open for project entries',
    description: 'UPCOMING and JUDGING cycles that creators/agencies can enter.',
  })
  @ApiOkResponse({ type: AwardCycleResponseDto, isArray: true })
  listOpen(): Promise<AwardCycleResponseDto[]> {
    return this.awardsService.listOpenCycles();
  }

  @Get('entries/by-submission/:submissionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List award-cycle entries for one of your submissions' })
  @ApiOkResponse({ type: AwardEntryResponseDto, isArray: true })
  @ApiUnauthorizedResponse()
  entriesForSubmission(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<AwardEntryResponseDto[]> {
    return this.awardsService.listEntriesForSubmission(submissionId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an award cycle with judges' })
  @ApiOkResponse({ type: AwardCycleResponseDto })
  get(@Param('id') id: string): Promise<AwardCycleResponseDto> {
    return this.awardsService.getCycle(id, true);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an award cycle (admin)' })
  @ApiCreatedResponse({ type: AwardCycleResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  create(@Body() dto: CreateAwardCycleDto): Promise<AwardCycleResponseDto> {
    return this.awardsService.createCycle(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an award cycle (admin)' })
  @ApiOkResponse({ type: AwardCycleResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAwardCycleDto,
  ): Promise<AwardCycleResponseDto> {
    return this.awardsService.updateCycle(id, dto);
  }

  @Post(':id/judges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a judge to a cycle (admin)' })
  @ApiOkResponse({ type: AwardCycleResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  assignJudge(
    @Param('id') id: string,
    @Body() dto: AssignJudgeDto,
  ): Promise<AwardCycleResponseDto> {
    return this.awardsService.assignJudge(id, dto);
  }

  @Delete(':id/judges/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a judge from a cycle (admin)' })
  @ApiOkResponse({ type: AwardCycleResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  removeJudge(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<AwardCycleResponseDto> {
    return this.awardsService.removeJudge(id, userId);
  }

  @Post(':id/submissions/enter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enter published submissions into judging (admin)',
    description:
      'Creates award entries, moves PUBLISHED submissions to UNDER_REVIEW, and opens JUDGING if needed.',
  })
  @ApiOkResponse({ type: EnterSubmissionsResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  enterSubmissions(
    @Param('id') id: string,
    @Body() dto: EnterSubmissionsDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EnterSubmissionsResponseDto> {
    return this.awardsService.enterSubmissions(id, dto, user.id);
  }

  @Post(':id/entries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enter your published project into an award cycle',
    description: 'Creators and agencies can nominate their own published work.',
  })
  @ApiOkResponse({ type: AwardEntryResponseDto })
  @ApiUnauthorizedResponse()
  enterOwn(
    @Param('id') id: string,
    @Body() dto: EnterOwnSubmissionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AwardEntryResponseDto> {
    return this.awardsService.enterOwnSubmission(id, user.id, dto.submissionId);
  }

  @Delete(':id/entries/:submissionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw your project from an award cycle' })
  @ApiOkResponse({
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse()
  withdrawOwn(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    return this.awardsService.withdrawOwnEntry(id, user.id, submissionId);
  }

  @Get(':id/queue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get judging queue for assigned judges (or admin)',
  })
  @ApiOkResponse({ type: JudgeQueueItemDto, isArray: true })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  queue(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<JudgeQueueItemDto[]> {
    return this.awardsService.getJudgeQueue(id, user.id);
  }

  @Post(':id/scores')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update a rubric score for a submission',
  })
  @ApiOkResponse({ type: JudgeScoreResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  upsertScore(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertJudgeScoreDto,
  ): Promise<JudgeScoreResponseDto> {
    return this.awardsService.upsertScore(id, user.id, dto);
  }

  @Get(':id/scores/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my scores for this cycle' })
  @ApiOkResponse({ type: JudgeScoreResponseDto, isArray: true })
  @ApiUnauthorizedResponse()
  myScores(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<JudgeScoreResponseDto[]> {
    return this.awardsService.listMyScores(id, user.id);
  }

  @Get(':id/scores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all scores for a cycle (admin)' })
  @ApiOkResponse({ type: JudgeScoreResponseDto, isArray: true })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  allScores(@Param('id') id: string): Promise<JudgeScoreResponseDto[]> {
    return this.awardsService.listCycleScores(id);
  }

  @Get(':id/scoreboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Aggregated scoreboard for shortlist decisions (admin)',
  })
  @ApiOkResponse({ type: ScoreboardItemDto, isArray: true })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  scoreboard(@Param('id') id: string): Promise<ScoreboardItemDto[]> {
    return this.awardsService.getScoreboard(id);
  }

  @Get(':id/results')
  @ApiOperation({
    summary: 'List published results for a cycle',
    description:
      'Public when cycle is RESULTS_PUBLISHED or CLOSED. Admins should use the admin results route while judging.',
  })
  @ApiOkResponse({ type: AwardResultItemDto, isArray: true })
  results(@Param('id') id: string): Promise<AwardResultItemDto[]> {
    return this.awardsService.listCycleResults(id, { publicOnly: true });
  }

  @Get(':id/results/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all results for a cycle (admin)' })
  @ApiOkResponse({ type: AwardResultItemDto, isArray: true })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  resultsAdmin(@Param('id') id: string): Promise<AwardResultItemDto[]> {
    return this.awardsService.listCycleResults(id);
  }

  @Post(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publish shortlist / winners for a cycle (admin)',
    description:
      'Upserts AwardResult rows, elevates submission status, and optionally marks the cycle RESULTS_PUBLISHED.',
  })
  @ApiOkResponse({ type: PublishResultsResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  publishResults(
    @Param('id') id: string,
    @Body() dto: PublishResultsDto,
  ): Promise<PublishResultsResponseDto> {
    return this.awardsService.publishResults(id, dto);
  }

  @Delete(':id/results/:submissionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a published result (admin)' })
  @ApiOkResponse({
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  removeResult(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
  ): Promise<{ message: string }> {
    return this.awardsService.removeResult(id, submissionId);
  }
}
