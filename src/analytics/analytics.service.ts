import { Injectable } from '@nestjs/common';
import {
  EventRsvpStatus,
  SubmissionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAnalyticsResponseDto } from './dto/admin-analytics-response.dto';

type DayCountRow = {
  day: Date;
  total: number;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminAnalytics(): Promise<AdminAnalyticsResponseDto> {
    const now = new Date();
    const sevenDaysAgo = startOfUtcDay(addDays(now, -7));
    const ninetyDaysAgo = startOfUtcDay(addDays(now, -90));

    const [
      statusGroups,
      published,
      totalVotes,
      totalRsvps,
      votesLast7Days,
      rsvpsLast7Days,
      categoryGroups,
      reviewable,
      covered,
      judgeGroups,
      votesOverTimeRows,
      events,
    ] = await Promise.all([
      this.prisma.submission.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.submission.count({
        where: { status: SubmissionStatus.PUBLISHED },
      }),
      this.prisma.like.count(),
      this.prisma.eventRsvp.count({
        where: { status: EventRsvpStatus.CONFIRMED },
      }),
      this.prisma.like.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.eventRsvp.count({
        where: {
          status: EventRsvpStatus.CONFIRMED,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.submission.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
      }),
      this.prisma.submission.count({
        where: { status: SubmissionStatus.UNDER_REVIEW },
      }),
      this.prisma.submission.count({
        where: {
          status: SubmissionStatus.UNDER_REVIEW,
          judgeScores: { some: {} },
        },
      }),
      this.prisma.judgeScore.groupBy({
        by: ['judgeId'],
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<DayCountRow[]>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::int AS total
        FROM likes
        WHERE "createdAt" >= ${ninetyDaysAgo}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY day ASC
      `,
      this.prisma.event.findMany({
        orderBy: [{ startsAt: 'asc' }, { title: 'asc' }],
        take: 20,
        include: {
          _count: {
            select: {
              rsvps: { where: { status: EventRsvpStatus.CONFIRMED } },
            },
          },
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of statusGroups) {
      byStatus[row.status] = row._count._all;
    }
    const submissionsByStatus = statusGroups.map((row) => ({
      status: row.status,
      total: row._count._all,
    }));

    const categoryIds = categoryGroups.map((row) => row.categoryId);
    const categories = categoryIds.length
      ? await this.prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
    const byCategory = categoryGroups
      .map((row) => ({
        category: categoryNameById.get(row.categoryId) ?? 'Unknown',
        total: row._count._all,
      }))
      .sort((a, b) => b.total - a.total);

    const judgeIds = judgeGroups.map((row) => row.judgeId);
    const judges = judgeIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: judgeIds } },
          select: { id: true, name: true },
        })
      : [];
    const judgeNameById = new Map(judges.map((j) => [j.id, j.name]));
    const judgeStats = judgeGroups
      .map((row) => ({
        judgeName: judgeNameById.get(row.judgeId) ?? 'Unknown',
        reviews: row._count._all,
      }))
      .sort((a, b) => b.reviews - a.reviews);

    const percent =
      reviewable === 0 ? 0 : Math.round((covered / reviewable) * 100);

    const votesOverTime = votesOverTimeRows.map((row) => ({
      day: toDayKey(row.day),
      total: Number(row.total),
    }));

    const eventFill = events.map((event) => {
      const rsvps = event._count.rsvps;
      const capacity = Math.max(event.capacity, 1);
      return {
        id: event.id,
        title: event.title,
        rsvps,
        capacity: event.capacity,
        fill: Math.round((rsvps / capacity) * 1000) / 10,
      };
    });

    const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);

    return {
      submissionsByStatus,
      votesLast7Days,
      rsvpsLast7Days,
      judgeCoverage: {
        covered,
        reviewable,
        percent,
        judges: judgeStats,
      },
      topCategories: byCategory.slice(0, 8),
      byCategory,
      votesOverTime,
      eventFill,
      funnel: {
        total,
        published,
        byStatus,
      },
      totals: {
        votes: totalVotes,
        rsvps: totalRsvps,
      },
    };
  }
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function toDayKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}
