import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, EventRsvpStatus, Prisma } from '@prisma/client';
import { slugify } from '../common/utils/string.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import {
  EventResponseDto,
  EventRsvpResponseDto,
} from './dto/event-response.dto';
import { UpdateEventDto } from './dto/update-event.dto';

type EventWithCounts = Event & {
  _count: { rsvps: number };
  rsvps?: { status: EventRsvpStatus }[];
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findUpcoming(
    limit = 20,
    userId?: string | null,
  ): Promise<EventResponseDto[]> {
    const take = Math.min(Math.max(limit, 1), 100);
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        isActive: true,
        startsAt: { gte: now },
      },
      orderBy: { startsAt: 'asc' },
      take,
      include: this.includeForUser(userId),
    });
    return events.map((event) => this.toResponse(event, userId));
  }

  async findAllAdmin(): Promise<EventResponseDto[]> {
    const events = await this.prisma.event.findMany({
      orderBy: [{ startsAt: 'asc' }, { title: 'asc' }],
      include: {
        _count: {
          select: {
            rsvps: { where: { status: EventRsvpStatus.CONFIRMED } },
          },
        },
      },
    });
    return events.map((event) => this.toResponse(event, null));
  }

  async findOne(
    idOrSlug: string,
    userId?: string | null,
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: this.includeForUser(userId),
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return this.toResponse(event, userId);
  }

  async create(
    dto: CreateEventDto,
    createdById: string,
  ): Promise<EventResponseDto> {
    const title = dto.title.trim();
    const slug = await this.buildUniqueSlug(dto.slug?.trim() || title);

    try {
      const event = await this.prisma.event.create({
        data: {
          title,
          slug,
          type: dto.type,
          format: dto.format,
          city: dto.city.trim(),
          venue: dto.venue.trim(),
          startsAt: new Date(dto.startsAt),
          capacity: dto.capacity,
          blurb: dto.blurb.trim(),
          createdById,
        },
        include: {
          _count: {
            select: {
              rsvps: { where: { status: EventRsvpStatus.CONFIRMED } },
            },
          },
        },
      });
      return this.toResponse(event, null);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Event slug already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventResponseDto> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    const data: Prisma.EventUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.format !== undefined) data.format = dto.format;
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.venue !== undefined) data.venue = dto.venue.trim();
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.blurb !== undefined) data.blurb = dto.blurb.trim();
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.slug !== undefined) {
      data.slug = await this.buildUniqueSlug(dto.slug.trim(), existing.id);
    } else if (dto.title !== undefined && dto.title.trim() !== existing.title) {
      data.slug = await this.buildUniqueSlug(dto.title.trim(), existing.id);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No event changes provided');
    }

    try {
      const event = await this.prisma.event.update({
        where: { id },
        data,
        include: {
          _count: {
            select: {
              rsvps: { where: { status: EventRsvpStatus.CONFIRMED } },
            },
          },
        },
      });
      return this.toResponse(event, null);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Event slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }
    await this.prisma.event.delete({ where: { id } });
  }

  async rsvp(eventId: string, userId: string): Promise<EventRsvpResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            rsvps: { where: { status: EventRsvpStatus.CONFIRMED } },
          },
        },
      },
    });
    if (!event || !event.isActive) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (
      existing &&
      (existing.status === EventRsvpStatus.CONFIRMED ||
        existing.status === EventRsvpStatus.WAITLISTED)
    ) {
      return {
        eventId,
        requested: true,
        spotsLeft: Math.max(0, event.capacity - event._count.rsvps),
        status: existing.status,
      };
    }

    const spotsLeft = Math.max(0, event.capacity - event._count.rsvps);
    const status =
      spotsLeft > 0 ? EventRsvpStatus.CONFIRMED : EventRsvpStatus.WAITLISTED;

    const rsvp = existing
      ? await this.prisma.eventRsvp.update({
          where: { id: existing.id },
          data: { status },
        })
      : await this.prisma.eventRsvp.create({
          data: { eventId, userId, status },
        });

    const confirmed = await this.prisma.eventRsvp.count({
      where: { eventId, status: EventRsvpStatus.CONFIRMED },
    });

    return {
      eventId,
      requested: true,
      spotsLeft: Math.max(0, event.capacity - confirmed),
      status: rsvp.status,
    };
  }

  async cancelRsvp(
    eventId: string,
    userId: string,
  ): Promise<EventRsvpResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            rsvps: { where: { status: EventRsvpStatus.CONFIRMED } },
          },
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!existing || existing.status === EventRsvpStatus.CANCELLED) {
      return {
        eventId,
        requested: false,
        spotsLeft: Math.max(0, event.capacity - event._count.rsvps),
        status: EventRsvpStatus.CANCELLED,
      };
    }

    await this.prisma.eventRsvp.update({
      where: { id: existing.id },
      data: { status: EventRsvpStatus.CANCELLED },
    });

    const confirmed = await this.prisma.eventRsvp.count({
      where: { eventId, status: EventRsvpStatus.CONFIRMED },
    });

    return {
      eventId,
      requested: false,
      spotsLeft: Math.max(0, event.capacity - confirmed),
      status: EventRsvpStatus.CANCELLED,
    };
  }

  private includeForUser(userId?: string | null) {
    return {
      _count: {
        select: {
          rsvps: { where: { status: EventRsvpStatus.CONFIRMED } },
        },
      },
      ...(userId
        ? {
            rsvps: {
              where: { userId },
              select: { status: true },
              take: 1,
            },
          }
        : {}),
    } satisfies Prisma.EventInclude;
  }

  private toResponse(
    event: EventWithCounts,
    userId?: string | null,
  ): EventResponseDto {
    const rsvpCount = event._count.rsvps;
    const spotsLeft = Math.max(0, event.capacity - rsvpCount);
    const myStatus = userId ? (event.rsvps?.[0]?.status ?? null) : null;
    const hasRsvp =
      myStatus === EventRsvpStatus.CONFIRMED ||
      myStatus === EventRsvpStatus.WAITLISTED;

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      type: event.type,
      format: event.format,
      city: event.city,
      venue: event.venue,
      startsAt: event.startsAt,
      capacity: event.capacity,
      blurb: event.blurb,
      isActive: event.isActive,
      createdById: event.createdById,
      rsvpCount,
      spotsLeft,
      hasRsvp,
      requested: hasRsvp,
      myRsvpStatus: myStatus,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private async buildUniqueSlug(source: string, excludeId?: string) {
    const base = slugify(source) || 'event';
    let candidate = base;
    let n = 2;
    while (true) {
      const existing = await this.prisma.event.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      candidate = `${base}-${n}`;
      n += 1;
    }
  }
}
