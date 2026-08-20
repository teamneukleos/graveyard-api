import { Injectable } from '@nestjs/common';
import { SubmissionStatus, UserRole } from '@prisma/client';
import { endOfUtcWeek, startOfUtcWeek } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatorsLeaderboardResponseDto,
  WorksLeaderboardResponseDto,
} from './dto/leaderboard-response.dto';

const PUBLIC_STATUSES: SubmissionStatus[] = [
  SubmissionStatus.PUBLISHED,
  SubmissionStatus.UNDER_REVIEW,
  SubmissionStatus.SHORTLISTED,
  SubmissionStatus.WINNER,
];

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async works(limit = 20): Promise<WorksLeaderboardResponseDto> {
    const window = this.currentWindow();

    const grouped = await this.prisma.like.groupBy({
      by: ['submissionId'],
      where: {
        createdAt: {
          gte: window.startsAt,
          lt: window.endsAt,
        },
        submission: {
          status: { in: PUBLIC_STATUSES },
        },
      },
      _sum: { weight: true },
      orderBy: { _sum: { weight: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) {
      return { window, items: [] };
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        id: { in: grouped.map((row) => row.submissionId) },
        status: { in: PUBLIC_STATUSES },
      },
      include: {
        category: { select: { slug: true } },
        creator: {
          select: {
            id: true,
            name: true,
            agencyName: true,
            role: true,
          },
        },
        assets: {
          where: { isCover: true },
          take: 1,
          select: { url: true },
        },
      },
    });

    const byId = new Map(submissions.map((s) => [s.id, s]));

    const items = grouped
      .map((row, index) => {
        const submission = byId.get(row.submissionId);
        if (!submission) return null;
        return {
          rank: index + 1,
          weeklyLikes: row._sum.weight ?? 0,
          submissionId: submission.id,
          title: submission.title,
          slug: submission.slug,
          likeCount: submission.likeCount,
          voteScore: submission.voteScore,
          coverUrl: submission.assets[0]?.url ?? null,
          categorySlug: submission.category.slug,
          creatorId: submission.creator.id,
          creatorName: submission.creator.name,
          agencyName: submission.creator.agencyName,
          creatorRole: submission.creator.role,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return { window, items };
  }

  async creators(limit = 20): Promise<CreatorsLeaderboardResponseDto> {
    return this.rankOwnersByRole(UserRole.CREATOR, limit);
  }

  async agencies(limit = 20): Promise<CreatorsLeaderboardResponseDto> {
    return this.rankOwnersByRole(UserRole.AGENCY, limit);
  }

  private async rankOwnersByRole(
    role: Extract<UserRole, 'CREATOR' | 'AGENCY'>,
    limit: number,
  ): Promise<CreatorsLeaderboardResponseDto> {
    const window = this.currentWindow();

    const likes = await this.prisma.like.findMany({
      where: {
        createdAt: {
          gte: window.startsAt,
          lt: window.endsAt,
        },
        submission: {
          status: { in: PUBLIC_STATUSES },
          creator: { role },
        },
      },
      select: {
        weight: true,
        submission: {
          select: { creatorId: true, id: true },
        },
      },
    });

    if (likes.length === 0) {
      return { window, items: [] };
    }

    const stats = new Map<
      string,
      { weeklyLikes: number; submissionIds: Set<string> }
    >();

    for (const like of likes) {
      const creatorId = like.submission.creatorId;
      const entry = stats.get(creatorId) ?? {
        weeklyLikes: 0,
        submissionIds: new Set<string>(),
      };
      entry.weeklyLikes += like.weight;
      entry.submissionIds.add(like.submission.id);
      stats.set(creatorId, entry);
    }

    const ranked = [...stats.entries()]
      .sort((a, b) => b[1].weeklyLikes - a[1].weeklyLikes)
      .slice(0, limit);

    const owners = await this.prisma.user.findMany({
      where: { id: { in: ranked.map(([id]) => id) }, role },
      select: {
        id: true,
        name: true,
        agencyName: true,
        avatarUrl: true,
      },
    });
    const ownerById = new Map(owners.map((c) => [c.id, c]));

    const items = ranked
      .map(([creatorId, data], index) => {
        const owner = ownerById.get(creatorId);
        if (!owner) return null;
        return {
          rank: index + 1,
          weeklyLikes: data.weeklyLikes,
          creatorId: owner.id,
          name: owner.agencyName || owner.name,
          agencyName: owner.agencyName,
          avatarUrl: owner.avatarUrl,
          likedSubmissions: data.submissionIds.size,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return { window, items };
  }

  private currentWindow() {
    return {
      startsAt: startOfUtcWeek(),
      endsAt: endOfUtcWeek(),
    };
  }
}
