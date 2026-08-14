import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventFormat, EventRsvpStatus, EventType } from '@prisma/client';

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: EventType })
  type: EventType;

  @ApiProperty({ enum: EventFormat })
  format: EventFormat;

  @ApiProperty()
  city: string;

  @ApiProperty()
  venue: string;

  @ApiProperty()
  startsAt: Date;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  blurb: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdById: string;

  @ApiProperty({ description: 'Count of CONFIRMED RSVPs' })
  rsvpCount: number;

  @ApiProperty({ description: 'capacity - confirmed RSVPs' })
  spotsLeft: number;

  @ApiProperty({
    description: 'True when the current user has a CONFIRMED or WAITLISTED RSVP',
  })
  hasRsvp: boolean;

  @ApiProperty({
    description: 'Alias of hasRsvp for the existing frontend RequestSeatButton',
  })
  requested: boolean;

  @ApiPropertyOptional({
    enum: EventRsvpStatus,
    nullable: true,
    description: 'Current user RSVP status, if any',
  })
  myRsvpStatus: EventRsvpStatus | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EventRsvpResponseDto {
  @ApiProperty()
  eventId: string;

  @ApiProperty()
  requested: boolean;

  @ApiProperty()
  spotsLeft: number;

  @ApiProperty({ enum: EventRsvpStatus })
  status: EventRsvpStatus;
}
