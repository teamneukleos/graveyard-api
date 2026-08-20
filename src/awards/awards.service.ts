import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AwardCycleStatus,
  AwardPlacement,
  Prisma,
  SubmissionStatus,
  UserRole,
  type AwardCycle,
  type JudgeScore,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignJudgeDto } from './dto/assign-judge.dto';
import {
  AwardCycleResponseDto,
  AwardEntryResponseDto,
  EnterSubmissionsResponseDto,
  JudgeQueueItemDto,
  JudgeScoreResponseDto,
} from './dto/award-response.dto';
import { CreateAwardCycleDto } from './dto/create-award-cycle.dto';
import { EnterSubmissionsDto } from './dto/enter-submissions.dto';
import { PublishResultsDto } from './dto/publish-results.dto';
import {
  AwardResultItemDto,
  PublishResultsResponseDto,
  ScoreboardItemDto,
} from './dto/result-response.dto';
import { ShowcaseQueryDto } from './dto/showcase-query.dto';
import { UpdateAwardCycleDto } from './dto/update-award-cycle.dto';
import { UpsertJudgeScoreDto } from './dto/upsert-judge-score.dto';

const resultInclude = {
  awardCycle: { select: { id: true, name: true, year: true, status: true } },
  category: { select: { id: true, name: true, slug: true } },
  submission: {
    include: {
      creator: { select: { name: true, agencyName: true } },
      assets: {
        where: { isCover: true },
        take: 1,
        select: { url: true },
      },
    },
  },
} satisfies Prisma.AwardResultInclude;

type ResultWithRelations = Prisma.AwardResultGetPayload<{
  include: typeof resultInclude;
}>;

const ALLOWED_STATUS_TRANSITIONS: Record<
  AwardCycleStatus,
  AwardCycleStatus[]
> = {
  UPCOMING: [AwardCycleStatus.JUDGING, AwardCycleStatus.CLOSED],
  JUDGING: [AwardCycleStatus.RESULTS_PUBLISHED, AwardCycleStatus.CLOSED],
  RESULTS_PUBLISHED: [AwardCycleStatus.CLOSED],
  CLOSED: [],
};

@Injectable()
export class AwardsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCycle(dto: CreateAwardCycleDto): Promise<AwardCycleResponseDto> {
    this.assertDateRange(dto.startsAt, dto.endsAt, dto.judgingEndsAt);

    try {
      const cycle = await this.prisma.awardCycle.create({
        data: {
          name: dto.name.trim(),
          year: dto.year,
          startsAt: dto.startsAt,
          endsAt: dto.endsAt ?? null,
          judgingEndsAt: dto.judgingEndsAt ?? null,
          status: AwardCycleStatus.UPCOMING,
        },
      });
      return this.toCycleResponse(cycle);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An award cycle with this name and year already exists',
        );
      }
      throw error;
    }
  }

  async listCycles(): Promise<AwardCycleResponseDto[]> {
    const cycles = await this.prisma.awardCycle.findMany({
      orderBy: [{ year: 'desc' }, { startsAt: 'desc' }],
      include: {
        _count: {
          select: { judgeAssignments: true, judgeScores: true },
        },
      },
    });

    return cycles.map((cycle) =>
      this.toCycleResponse(cycle, {
        judgeCount: cycle._count.judgeAssignments,
        scoreCount: cycle._count.judgeScores,
      }),
    );
  }

  async getCycle(
    id: string,
    withJudges = false,
  ): Promise<AwardCycleResponseDto> {
    if (withJudges) {
      const cycle = await this.prisma.awardCycle.findUnique({
        where: { id },
        include: {
          judgeAssignments: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { judgeAssignments: true, judgeScores: true },
          },
        },
      });

      if (!cycle) {
        throw new NotFoundException('Award cycle not found');
      }

      return this.toCycleResponse(
        cycle,
        {
          judgeCount: cycle._count.judgeAssignments,
          scoreCount: cycle._count.judgeScores,
        },
        cycle.judgeAssignments.map((assignment) => ({
          userId: assignment.user.id,
          name: assignment.user.name,
          email: assignment.user.email,
          assignedAt: assignment.createdAt,
        })),
      );
    }

    const cycle = await this.prisma.awardCycle.findUnique({
      where: { id },
      include: {
        _count: {
          select: { judgeAssignments: true, judgeScores: true },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('Award cycle not found');
    }

    return this.toCycleResponse(cycle, {
      judgeCount: cycle._count.judgeAssignments,
      scoreCount: cycle._count.judgeScores,
    });
  }

  async updateCycle(
    id: string,
    dto: UpdateAwardCycleDto,
  ): Promise<AwardCycleResponseDto> {
    const existing = await this.getCycleOrThrow(id);

    if (dto.status && dto.status !== existing.status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[existing.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot move cycle from ${existing.status} to ${dto.status}`,
        );
      }
    }

    const startsAt = dto.startsAt ?? existing.startsAt;
    const endsAt = dto.endsAt === undefined ? existing.endsAt : dto.endsAt;
    const judgingEndsAt =
      dto.judgingEndsAt === undefined
        ? existing.judgingEndsAt
        : dto.judgingEndsAt;
    this.assertDateRange(startsAt, endsAt, judgingEndsAt);

    try {
      const cycle = await this.prisma.awardCycle.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          year: dto.year,
          startsAt: dto.startsAt,
          endsAt: dto.endsAt,
          judgingEndsAt: dto.judgingEndsAt,
          status: dto.status,
        },
      });
      return this.toCycleResponse(cycle);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An award cycle with this name and year already exists',
        );
      }
      throw error;
    }
  }

  async assignJudge(
    cycleId: string,
    dto: AssignJudgeDto,
  ): Promise<AwardCycleResponseDto> {
    await this.getCycleOrThrow(cycleId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.judgeAssignment.upsert({
        where: {
          awardCycleId_userId: {
            awardCycleId: cycleId,
            userId: dto.userId,
          },
        },
        create: {
          awardCycleId: cycleId,
          userId: dto.userId,
        },
        update: {},
      });

      if (user.role === UserRole.CREATOR) {
        await tx.user.update({
          where: { id: user.id },
          data: { role: UserRole.JUDGE },
        });
      }
    });

    return this.getCycle(cycleId, true);
  }

  async removeJudge(
    cycleId: string,
    userId: string,
  ): Promise<AwardCycleResponseDto> {
    await this.getCycleOrThrow(cycleId);

    const assignment = await this.prisma.judgeAssignment.findUnique({
      where: {
        awardCycleId_userId: { awardCycleId: cycleId, userId },
      },
    });
    if (!assignment) {
      throw new NotFoundException('Judge assignment not found');
    }

    await this.prisma.judgeAssignment.delete({ where: { id: assignment.id } });
    return this.getCycle(cycleId, true);
  }

  async enterSubmissions(
    cycleId: string,
    dto: EnterSubmissionsDto,
    enteredById?: string,
  ): Promise<EnterSubmissionsResponseDto> {
    const cycle = await this.getCycleOrThrow(cycleId);
    if (
      cycle.status !== AwardCycleStatus.JUDGING &&
      cycle.status !== AwardCycleStatus.UPCOMING
    ) {
      throw new BadRequestException(
        'Submissions can only be entered while the cycle is UPCOMING or JUDGING',
      );
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        id: { in: dto.submissionIds },
        status: {
          in: [
            SubmissionStatus.PUBLISHED,
            SubmissionStatus.UNDER_REVIEW,
            SubmissionStatus.SHORTLISTED,
            SubmissionStatus.WINNER,
          ],
        },
      },
      select: { id: true, creatorId: true },
    });

    if (submissions.length === 0) {
      throw new BadRequestException('No valid public submissions found');
    }

    const ids = submissions.map((s) => s.id);
    await this.prisma.$transaction(async (tx) => {
      for (const submission of submissions) {
        await tx.awardEntry.upsert({
          where: {
            awardCycleId_submissionId: {
              awardCycleId: cycleId,
              submissionId: submission.id,
            },
          },
          create: {
            awardCycleId: cycleId,
            submissionId: submission.id,
            enteredById: enteredById || submission.creatorId,
          },
          update: {},
        });
      }

      await tx.submission.updateMany({
        where: {
          id: { in: ids },
          status: SubmissionStatus.PUBLISHED,
        },
        data: { status: SubmissionStatus.UNDER_REVIEW },
      });

      if (cycle.status === AwardCycleStatus.UPCOMING) {
        await tx.awardCycle.update({
          where: { id: cycleId },
          data: { status: AwardCycleStatus.JUDGING },
        });
      }
    });

    return {
      entered: ids.length,
      submissionIds: ids,
    };
  }

  async enterOwnSubmission(
    cycleId: string,
    userId: string,
    submissionId: string,
  ): Promise<AwardEntryResponseDto> {
    const cycle = await this.getCycleOrThrow(cycleId);
    if (
      cycle.status !== AwardCycleStatus.JUDGING &&
      cycle.status !== AwardCycleStatus.UPCOMING
    ) {
      throw new BadRequestException(
        'You can only enter work while the cycle is open for entries',
      );
    }

    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        creatorId: userId,
        status: {
          in: [SubmissionStatus.PUBLISHED, SubmissionStatus.UNDER_REVIEW],
        },
      },
      select: { id: true, title: true, status: true },
    });
    if (!submission) {
      throw new NotFoundException(
        'Published submission not found (or you do not own it)',
      );
    }

    const existing = await this.prisma.awardEntry.findUnique({
      where: {
        awardCycleId_submissionId: {
          awardCycleId: cycleId,
          submissionId: submission.id,
        },
      },
    });
    if (existing) {
      throw new ConflictException('This project is already entered in this cycle');
    }

    const entry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.awardEntry.create({
        data: {
          awardCycleId: cycleId,
          submissionId: submission.id,
          enteredById: userId,
        },
      });

      if (submission.status === SubmissionStatus.PUBLISHED) {
        await tx.submission.update({
          where: { id: submission.id },
          data: { status: SubmissionStatus.UNDER_REVIEW },
        });
      }

      if (cycle.status === AwardCycleStatus.UPCOMING) {
        await tx.awardCycle.update({
          where: { id: cycleId },
          data: { status: AwardCycleStatus.JUDGING },
        });
      }

      return created;
    });

    return {
      id: entry.id,
      awardCycleId: entry.awardCycleId,
      submissionId: entry.submissionId,
      enteredById: entry.enteredById,
      createdAt: entry.createdAt,
      cycleName: cycle.name,
      cycleYear: cycle.year,
      cycleStatus: AwardCycleStatus.JUDGING,
      submissionTitle: submission.title,
    };
  }

  async withdrawOwnEntry(
    cycleId: string,
    userId: string,
    submissionId: string,
  ): Promise<{ message: string }> {
    const cycle = await this.getCycleOrThrow(cycleId);
    if (
      cycle.status !== AwardCycleStatus.JUDGING &&
      cycle.status !== AwardCycleStatus.UPCOMING
    ) {
      throw new BadRequestException(
        'Entries can only be withdrawn while the cycle is open',
      );
    }

    const entry = await this.prisma.awardEntry.findUnique({
      where: {
        awardCycleId_submissionId: {
          awardCycleId: cycleId,
          submissionId,
        },
      },
    });
    if (!entry || entry.enteredById !== userId) {
      throw new NotFoundException('Entry not found');
    }

    const scoreCount = await this.prisma.judgeScore.count({
      where: { awardCycleId: cycleId, submissionId },
    });
    if (scoreCount > 0) {
      throw new BadRequestException(
        'Cannot withdraw after judges have started scoring this project',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.awardEntry.delete({ where: { id: entry.id } });

      const remaining = await tx.awardEntry.count({
        where: { submissionId },
      });
      if (remaining === 0) {
        await tx.submission.updateMany({
          where: {
            id: submissionId,
            status: SubmissionStatus.UNDER_REVIEW,
            creatorId: userId,
          },
          data: { status: SubmissionStatus.PUBLISHED },
        });
      }
    });

    return { message: 'Withdrawn from award cycle' };
  }

  async listOpenCycles(): Promise<AwardCycleResponseDto[]> {
    const cycles = await this.prisma.awardCycle.findMany({
      where: {
        status: {
          in: [AwardCycleStatus.UPCOMING, AwardCycleStatus.JUDGING],
        },
      },
      orderBy: [{ year: 'desc' }, { startsAt: 'desc' }],
      include: {
        _count: {
          select: {
            judgeAssignments: true,
            judgeScores: true,
            awardEntries: true,
          },
        },
      },
    });

    return cycles.map((cycle) =>
      this.toCycleResponse(cycle, {
        judgeCount: cycle._count.judgeAssignments,
        scoreCount: cycle._count.judgeScores,
      }),
    );
  }

  async listEntriesForSubmission(
    submissionId: string,
    userId: string,
  ): Promise<AwardEntryResponseDto[]> {
    const submission = await this.prisma.submission.findFirst({
      where: { id: submissionId, creatorId: userId },
      select: { id: true },
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const entries = await this.prisma.awardEntry.findMany({
      where: { submissionId },
      include: {
        awardCycle: {
          select: { id: true, name: true, year: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      awardCycleId: entry.awardCycleId,
      submissionId: entry.submissionId,
      enteredById: entry.enteredById,
      createdAt: entry.createdAt,
      cycleName: entry.awardCycle.name,
      cycleYear: entry.awardCycle.year,
      cycleStatus: entry.awardCycle.status,
    }));
  }

  async getJudgeQueue(
    cycleId: string,
    judgeId: string,
  ): Promise<JudgeQueueItemDto[]> {
    const cycle = await this.ensureJudgeAccess(cycleId, judgeId);

    if (
      cycle.status !== AwardCycleStatus.JUDGING &&
      cycle.status !== AwardCycleStatus.RESULTS_PUBLISHED
    ) {
      throw new BadRequestException(
        'Judging queue is only available during JUDGING or RESULTS_PUBLISHED',
      );
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        OR: [
          { awardEntries: { some: { awardCycleId: cycleId } } },
          {
            status: SubmissionStatus.UNDER_REVIEW,
            yearCreated: cycle.year,
          },
          { judgeScores: { some: { awardCycleId: cycleId } } },
        ],
      },
      include: {
        category: { select: { slug: true } },
        creator: { select: { name: true } },
        assets: {
          where: { isCover: true },
          take: 1,
          select: { url: true },
        },
        judgeScores: {
          where: { awardCycleId: cycleId, judgeId },
          select: { total: true },
          take: 1,
        },
      },
      orderBy: [{ categoryId: 'asc' }, { title: 'asc' }],
    });

    return submissions.map((submission) => ({
      submissionId: submission.id,
      title: submission.title,
      slug: submission.slug,
      yearCreated: submission.yearCreated,
      categorySlug: submission.category.slug,
      creatorName: submission.creator.name,
      coverUrl: submission.assets[0]?.url ?? null,
      scoredByMe: submission.judgeScores.length > 0,
      myTotal: submission.judgeScores[0]?.total ?? null,
    }));
  }

  async upsertScore(
    cycleId: string,
    judgeId: string,
    dto: UpsertJudgeScoreDto,
  ): Promise<JudgeScoreResponseDto> {
    const cycle = await this.ensureJudgeAccess(cycleId, judgeId);

    if (cycle.status !== AwardCycleStatus.JUDGING) {
      throw new BadRequestException(
        'Scores can only be submitted while the cycle is JUDGING',
      );
    }

    if (cycle.judgingEndsAt && cycle.judgingEndsAt.getTime() < Date.now()) {
      throw new BadRequestException('Judging window has ended');
    }

    const submission = await this.prisma.submission.findFirst({
      where: {
        id: dto.submissionId,
        status: {
          in: [
            SubmissionStatus.UNDER_REVIEW,
            SubmissionStatus.SHORTLISTED,
            SubmissionStatus.PUBLISHED,
            SubmissionStatus.WINNER,
          ],
        },
      },
      include: {
        teamMembers: { select: { name: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.creatorId === judgeId) {
      throw new ForbiddenException('You cannot score your own submission');
    }

    const judge = await this.prisma.user.findUnique({
      where: { id: judgeId },
      select: { name: true },
    });
    const judgeName = judge?.name.trim().toLowerCase();
    if (
      judgeName &&
      submission.teamMembers.some(
        (member) => member.name.trim().toLowerCase() === judgeName,
      )
    ) {
      throw new ForbiddenException(
        'You cannot score a submission you are credited on',
      );
    }

    const rubric = this.resolveRubricScores(dto);
    const total =
      rubric.concept + rubric.craft + rubric.story + rubric.deservedLife;

    const score = await this.prisma.judgeScore.upsert({
      where: {
        awardCycleId_submissionId_judgeId: {
          awardCycleId: cycleId,
          submissionId: dto.submissionId,
          judgeId,
        },
      },
      create: {
        awardCycleId: cycleId,
        submissionId: dto.submissionId,
        judgeId,
        concept: rubric.concept,
        craft: rubric.craft,
        story: rubric.story,
        deservedLife: rubric.deservedLife,
        total,
        comment: dto.comment?.trim() || null,
      },
      update: {
        concept: rubric.concept,
        craft: rubric.craft,
        story: rubric.story,
        deservedLife: rubric.deservedLife,
        total,
        comment: dto.comment?.trim() || null,
      },
    });

    // Keep gallery visibility while marking it in the judging pool
    if (submission.status === SubmissionStatus.PUBLISHED) {
      await this.prisma.submission.update({
        where: { id: submission.id },
        data: { status: SubmissionStatus.UNDER_REVIEW },
      });
    }

    return this.toScoreResponse(score);
  }

  async listMyScores(
    cycleId: string,
    judgeId: string,
  ): Promise<JudgeScoreResponseDto[]> {
    await this.ensureJudgeAccess(cycleId, judgeId);

    const scores = await this.prisma.judgeScore.findMany({
      where: { awardCycleId: cycleId, judgeId },
      orderBy: { updatedAt: 'desc' },
    });

    return scores.map((score) => this.toScoreResponse(score));
  }

  async listCycleScores(cycleId: string): Promise<JudgeScoreResponseDto[]> {
    await this.getCycleOrThrow(cycleId);

    const scores = await this.prisma.judgeScore.findMany({
      where: { awardCycleId: cycleId },
      orderBy: [{ submissionId: 'asc' }, { updatedAt: 'desc' }],
    });

    return scores.map((score) => this.toScoreResponse(score));
  }

  async getScoreboard(cycleId: string): Promise<ScoreboardItemDto[]> {
    await this.getCycleOrThrow(cycleId);

    const grouped = await this.prisma.judgeScore.groupBy({
      by: ['submissionId'],
      where: { awardCycleId: cycleId },
      _avg: { total: true },
      _count: { _all: true },
      orderBy: { _avg: { total: 'desc' } },
    });

    if (grouped.length === 0) {
      return [];
    }

    const submissionIds = grouped.map((row) => row.submissionId);
    const [submissions, results] = await Promise.all([
      this.prisma.submission.findMany({
        where: { id: { in: submissionIds } },
        include: {
          category: { select: { id: true, slug: true } },
          creator: { select: { name: true } },
        },
      }),
      this.prisma.awardResult.findMany({
        where: { awardCycleId: cycleId, submissionId: { in: submissionIds } },
        select: { submissionId: true, placement: true },
      }),
    ]);

    const submissionById = new Map(submissions.map((s) => [s.id, s]));
    const placementById = new Map(
      results.map((r) => [r.submissionId, r.placement]),
    );

    return grouped
      .map((row) => {
        const submission = submissionById.get(row.submissionId);
        if (!submission) return null;
        return {
          submissionId: submission.id,
          title: submission.title,
          slug: submission.slug,
          categoryId: submission.category.id,
          categorySlug: submission.category.slug,
          creatorName: submission.creator.name,
          scoreCount: row._count._all,
          averageTotal: Number((row._avg.total ?? 0).toFixed(2)),
          placement: placementById.get(submission.id) ?? null,
        };
      })
      .filter((item): item is ScoreboardItemDto => item !== null);
  }

  async publishResults(
    cycleId: string,
    dto: PublishResultsDto,
  ): Promise<PublishResultsResponseDto> {
    const cycle = await this.getCycleOrThrow(cycleId);

    if (
      cycle.status !== AwardCycleStatus.JUDGING &&
      cycle.status !== AwardCycleStatus.RESULTS_PUBLISHED
    ) {
      throw new BadRequestException(
        'Results can only be published while the cycle is JUDGING or RESULTS_PUBLISHED',
      );
    }

    const uniqueIds = [...new Set(dto.results.map((r) => r.submissionId))];
    if (uniqueIds.length !== dto.results.length) {
      throw new BadRequestException(
        'Duplicate submissionIds in results payload',
      );
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        id: { in: uniqueIds },
        status: {
          in: [
            SubmissionStatus.PUBLISHED,
            SubmissionStatus.UNDER_REVIEW,
            SubmissionStatus.SHORTLISTED,
            SubmissionStatus.WINNER,
          ],
        },
      },
      select: { id: true, categoryId: true },
    });

    if (submissions.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more submissions are missing or not eligible',
      );
    }

    const submissionById = new Map(submissions.map((s) => [s.id, s]));

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.results) {
        const submission = submissionById.get(item.submissionId);
        if (!submission) continue;

        await tx.awardResult.upsert({
          where: {
            awardCycleId_submissionId: {
              awardCycleId: cycleId,
              submissionId: item.submissionId,
            },
          },
          create: {
            awardCycleId: cycleId,
            submissionId: item.submissionId,
            categoryId: submission.categoryId,
            placement: item.placement,
            publishedAt: new Date(),
          },
          update: {
            categoryId: submission.categoryId,
            placement: item.placement,
            publishedAt: new Date(),
          },
        });

        const status =
          item.placement === AwardPlacement.WINNER
            ? SubmissionStatus.WINNER
            : SubmissionStatus.SHORTLISTED;

        await tx.submission.update({
          where: { id: item.submissionId },
          data: { status },
        });
      }

      if (
        (dto.markCyclePublished ?? true) &&
        cycle.status === AwardCycleStatus.JUDGING
      ) {
        await tx.awardCycle.update({
          where: { id: cycleId },
          data: { status: AwardCycleStatus.RESULTS_PUBLISHED },
        });
      }
    });

    const results = await this.prisma.awardResult.findMany({
      where: {
        awardCycleId: cycleId,
        submissionId: { in: uniqueIds },
      },
      include: resultInclude,
      orderBy: [{ placement: 'asc' }, { publishedAt: 'desc' }],
    });

    const updatedCycle = await this.getCycleOrThrow(cycleId);

    return {
      published: results.length,
      results: results.map((result) => this.toResultResponse(result)),
      cycleStatus: updatedCycle.status,
    };
  }

  async listCycleResults(
    cycleId: string,
    opts?: { publicOnly?: boolean },
  ): Promise<AwardResultItemDto[]> {
    const cycle = await this.getCycleOrThrow(cycleId);

    if (
      opts?.publicOnly &&
      cycle.status !== AwardCycleStatus.RESULTS_PUBLISHED &&
      cycle.status !== AwardCycleStatus.CLOSED
    ) {
      throw new NotFoundException('Results are not published for this cycle');
    }

    const results = await this.prisma.awardResult.findMany({
      where: { awardCycleId: cycleId },
      include: resultInclude,
      orderBy: [{ placement: 'asc' }, { publishedAt: 'desc' }],
    });

    return results.map((result) => this.toResultResponse(result));
  }

  async removeResult(
    cycleId: string,
    submissionId: string,
  ): Promise<{ message: string }> {
    const cycle = await this.getCycleOrThrow(cycleId);

    if (
      cycle.status !== AwardCycleStatus.JUDGING &&
      cycle.status !== AwardCycleStatus.RESULTS_PUBLISHED
    ) {
      throw new BadRequestException(
        'Results can only be removed while the cycle is JUDGING or RESULTS_PUBLISHED',
      );
    }

    const existing = await this.prisma.awardResult.findUnique({
      where: {
        awardCycleId_submissionId: { awardCycleId: cycleId, submissionId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Award result not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.awardResult.delete({ where: { id: existing.id } });
      await tx.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.UNDER_REVIEW },
      });
    });

    return { message: 'Award result removed' };
  }

  async showcase(query: ShowcaseQueryDto): Promise<AwardResultItemDto[]> {
    const where: Prisma.AwardResultWhereInput = {
      awardCycle: {
        status: {
          in: [
            AwardCycleStatus.RESULTS_PUBLISHED,
            AwardCycleStatus.CLOSED,
          ],
        },
      },
    };

    if (query.cycleId) {
      where.awardCycleId = query.cycleId;
    }
    if (query.year) {
      where.awardCycle = {
        ...(where.awardCycle as Prisma.AwardCycleWhereInput),
        year: query.year,
      };
    }
    if (query.placement) {
      where.placement = query.placement;
    }
    if (query.category) {
      where.category = { slug: query.category, isActive: true };
    }

    const results = await this.prisma.awardResult.findMany({
      where,
      include: resultInclude,
      orderBy: [
        { awardCycle: { year: 'desc' } },
        { placement: 'desc' },
        { publishedAt: 'desc' },
      ],
    });

    return results.map((result) => this.toResultResponse(result));
  }

  private async ensureJudgeAccess(cycleId: string, userId: string) {
    const cycle = await this.getCycleOrThrow(cycleId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN
    ) {
      return cycle;
    }

    const assignment = await this.prisma.judgeAssignment.findUnique({
      where: {
        awardCycleId_userId: { awardCycleId: cycleId, userId },
      },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this award cycle');
    }

    return cycle;
  }

  private resolveRubricScores(dto: UpsertJudgeScoreDto): {
    concept: number;
    craft: number;
    story: number;
    deservedLife: number;
  } {
    if (dto.overall != null) {
      return {
        concept: dto.overall,
        craft: dto.overall,
        story: dto.overall,
        deservedLife: dto.overall,
      };
    }

    if (
      dto.concept == null ||
      dto.craft == null ||
      dto.story == null ||
      dto.deservedLife == null
    ) {
      throw new BadRequestException(
        'Provide overall, or all four rubric scores (concept, craft, story, deservedLife)',
      );
    }

    return {
      concept: dto.concept,
      craft: dto.craft,
      story: dto.story,
      deservedLife: dto.deservedLife,
    };
  }

  private async getCycleOrThrow(id: string): Promise<AwardCycle> {
    const cycle = await this.prisma.awardCycle.findUnique({ where: { id } });
    if (!cycle) {
      throw new NotFoundException('Award cycle not found');
    }
    return cycle;
  }

  private assertDateRange(
    startsAt: Date,
    endsAt?: Date | null,
    judgingEndsAt?: Date | null,
  ) {
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    if (judgingEndsAt && judgingEndsAt < startsAt) {
      throw new BadRequestException('judgingEndsAt must be on or after startsAt');
    }
  }

  private toCycleResponse(
    cycle: AwardCycle,
    counts?: { judgeCount?: number; scoreCount?: number },
    judges?: AwardCycleResponseDto['judges'],
  ): AwardCycleResponseDto {
    return {
      id: cycle.id,
      name: cycle.name,
      year: cycle.year,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
      judgingEndsAt: cycle.judgingEndsAt,
      status: cycle.status,
      createdAt: cycle.createdAt,
      updatedAt: cycle.updatedAt,
      judgeCount: counts?.judgeCount,
      scoreCount: counts?.scoreCount,
      judges,
    };
  }

  private toScoreResponse(score: JudgeScore): JudgeScoreResponseDto {
    return {
      id: score.id,
      awardCycleId: score.awardCycleId,
      submissionId: score.submissionId,
      judgeId: score.judgeId,
      concept: score.concept,
      craft: score.craft,
      story: score.story,
      deservedLife: score.deservedLife,
      total: score.total,
      comment: score.comment,
      createdAt: score.createdAt,
      updatedAt: score.updatedAt,
    };
  }

  private toResultResponse(result: ResultWithRelations): AwardResultItemDto {
    return {
      id: result.id,
      awardCycleId: result.awardCycleId,
      cycleName: result.awardCycle.name,
      cycleYear: result.awardCycle.year,
      submissionId: result.submissionId,
      title: result.submission.title,
      slug: result.submission.slug,
      categoryId: result.category.id,
      categorySlug: result.category.slug,
      categoryName: result.category.name,
      placement: result.placement,
      creatorName: result.submission.creator.name,
      agencyName: result.submission.creator.agencyName,
      coverUrl: result.submission.assets[0]?.url ?? null,
      likeCount: result.submission.likeCount,
      publishedAt: result.publishedAt,
    };
  }
}
