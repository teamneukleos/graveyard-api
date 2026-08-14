import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateEventDto } from './dto/create-event.dto';
import {
  EventResponseDto,
  EventRsvpResponseDto,
} from './dto/event-response.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List upcoming active events' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: EventResponseDto, isArray: true })
  findUpcoming(
    @Query('limit') limit?: string,
    @CurrentUser() user?: AuthUser | null,
  ): Promise<EventResponseDto[]> {
    const parsed = limit ? Number(limit) : 20;
    return this.eventsService.findUpcoming(
      Number.isFinite(parsed) ? parsed : 20,
      user?.id,
    );
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all events including inactive (admin)' })
  @ApiOkResponse({ type: EventResponseDto, isArray: true })
  findAllAdmin(): Promise<EventResponseDto[]> {
    return this.eventsService.findAllAdmin();
  }

  @Get(':idOrSlug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one event by id or slug' })
  @ApiOkResponse({ type: EventResponseDto })
  findOne(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user?: AuthUser | null,
  ): Promise<EventResponseDto> {
    return this.eventsService.findOne(idOrSlug, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an event (admin)' })
  @ApiCreatedResponse({ type: EventResponseDto })
  create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EventResponseDto> {
    return this.eventsService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event (admin)' })
  @ApiOkResponse({ type: EventResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an event (admin)' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.eventsService.remove(id);
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'RSVP or join waitlist for an event' })
  @ApiOkResponse({ type: EventRsvpResponseDto })
  rsvp(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<EventRsvpResponseDto> {
    return this.eventsService.rsvp(id, user.id);
  }

  @Delete(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an event RSVP' })
  @ApiOkResponse({ type: EventRsvpResponseDto })
  cancelRsvp(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<EventRsvpResponseDto> {
    return this.eventsService.cancelRsvp(id, user.id);
  }
}
