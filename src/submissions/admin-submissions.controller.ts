import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminBulkSubmissionsDto } from './dto/admin-bulk-submissions.dto';
import { AdminUpdateSubmissionDto } from './dto/admin-update-submission.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('admin-submissions')
@Controller('admin/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminSubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List submissions for admin (includes drafts)' })
  @ApiOkResponse({ type: SubmissionResponseDto, isArray: true })
  list(@Query('limit') limit?: string) {
    return this.submissionsService.adminFindAll(
      limit ? Number(limit) : undefined,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update submission status (admin)' })
  @ApiOkResponse({ type: SubmissionResponseDto })
  update(@Param('id') id: string, @Body() dto: AdminUpdateSubmissionDto) {
    return this.submissionsService.adminUpdate(id, dto);
  }

  @Post('bulk')
  @ApiOperation({
    summary:
      'Bulk publish/unpublish, enter judging, or mark winners/shortlist (admin)',
  })
  bulk(@Body() dto: AdminBulkSubmissionsDto) {
    return this.submissionsService.adminBulk(dto);
  }
}
