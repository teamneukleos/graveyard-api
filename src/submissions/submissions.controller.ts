import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ListSubmissionsQueryDto } from './dto/list-submissions-query.dto';
import {
  PaginatedSubmissionsResponseDto,
  SubmissionResponseDto,
} from './dto/submission-response.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Browse published submissions' })
  @ApiOkResponse({ type: PaginatedSubmissionsResponseDto })
  findPublic(
    @Query() query: ListSubmissionsQueryDto,
  ): Promise<PaginatedSubmissionsResponseDto> {
    return this.submissionsService.findPublic(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List submissions owned by the current user' })
  @ApiOkResponse({ type: SubmissionResponseDto, isArray: true })
  @ApiUnauthorizedResponse()
  findMine(@CurrentUser() user: AuthUser): Promise<SubmissionResponseDto[]> {
    return this.submissionsService.findMine(user.id);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one owned submission by id (includes drafts)' })
  @ApiOkResponse({ type: SubmissionResponseDto })
  findMineById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.findMineById(user.id, id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published submission by slug' })
  @ApiOkResponse({ type: SubmissionResponseDto })
  findPublicBySlug(@Param('slug') slug: string): Promise<SubmissionResponseDto> {
    return this.submissionsService.findPublicBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a draft submission' })
  @ApiCreatedResponse({ type: SubmissionResponseDto })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a draft submission' })
  @ApiOkResponse({ type: SubmissionResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.update(user.id, id, dto);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft submission to the public gallery' })
  @ApiOkResponse({ type: SubmissionResponseDto })
  publish(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.publish(user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a draft submission' })
  @ApiOkResponse({
    schema: { properties: { message: { type: 'string' } } },
  })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.submissionsService.remove(user.id, id);
  }
}
