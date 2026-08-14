import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { AdminAnalyticsResponseDto } from './dto/admin-analytics-response.dto';

@ApiTags('admin-analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({
    summary: 'Admin dashboard analytics',
    description:
      'Funnel counts, vote momentum, category mix, event fill, and judge coverage.',
  })
  @ApiOkResponse({ type: AdminAnalyticsResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  getAdminAnalytics(): Promise<AdminAnalyticsResponseDto> {
    return this.analyticsService.getAdminAnalytics();
  }
}
