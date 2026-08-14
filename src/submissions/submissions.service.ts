import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AwardCycleStatus,
  AwardPlacement,
  Prisma,
  SubmissionStatus,
  type Asset,
  type Category,
  type Submission,
  type TeamMember,
  type User,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { AwardsService } from '../awards/awards.service';
import { slugify } from '../common/utils/string.util';
import { PrismaService } from '../prisma/prisma.service';
import { AdminBulkSubmissionsDto } from './dto/admin-bulk-submissions.dto';
import { AdminUpdateSubmissionDto } from './dto/admin-update-submission.dto';
import { AssetDto } from './dto/asset.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ListSubmissionsQueryDto } from './dto/list-submissions-query.dto';
import {
  PaginatedSubmissionsResponseDto,
  SubmissionResponseDto,
} from './dto/submission-response.dto';
import { TeamMemberDto } from './dto/team-member.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

type SubmissionWithRelations = Submission & {
  category: Category;
  creator: Pick<User, 'id' | 'name' | 'agencyName' | 'avatarUrl'>;
  teamMembers: TeamMember[];
  assets: Asset[];
};

const submissionInclude = {
  category: true,
  creator: {
    select: {
      id: true,
      name: true,
      agencyName: true,
      avatarUrl: true,
    },
  },
  teamMembers: { orderBy: { sortOrder: 'asc' as const } },
  assets: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.SubmissionInclude;

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awardsService: AwardsService,
  ) {}

  async create(
    creatorId: string,
    dto: CreateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    await this.ensureActiveCategory(dto.categoryId);
    const slug = await this.buildUniqueSlug(dto.title);

    const submission = await this.prisma.submission.create({
      data: {
        title: dto.title.trim(),
        slug,
        categoryId: dto.categoryId,
        creatorId,
        submitterType: dto.submitterType,
        yearCreated: dto.yearCreated,
        concept: dto.concept.trim(),
        whyNeverLived: dto.whyNeverLived.trim(),
        rightsAttested: dto.rightsAttested ?? false,
        status: SubmissionStatus.DRAFT,
        teamMembers: dto.teamMembers?.length
          ? { create: this.mapTeamMembers(dto.teamMembers) }
          : undefined,
        assets: dto.assets?.length
          ? { create: this.mapAssets(dto.assets) }
          : undefined,
      },
      include: submissionInclude,
    });

    return this.toResponse(submission);
  }

  async findPublic(
    query: ListSubmissionsQueryDto,
  ): Promise<PaginatedSubmissionsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SubmissionWhereInput = {
      status: {
        in: [
          SubmissionStatus.PUBLISHED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.SHORTLISTED,
          SubmissionStatus.WINNER,
        ],
      },
    };

    if (query.category) {
      where.category = { slug: query.category, isActive: true };
    }
    if (query.year) {
      where.yearCreated = query.year;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.submission.count({ where }),
      this.prisma.submission.findMany({
        where,
        include: submissionInclude,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toResponse(row)),
      total,
      page,
      limit,
    };
  }

  async findMine(creatorId: string): Promise<SubmissionResponseDto[]> {
    const rows = await this.prisma.submission.findMany({
      where: { creatorId },
      include: submissionInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findMineById(
    creatorId: string,
    id: string,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.prisma.submission.findFirst({
      where: { id, creatorId },
      include: submissionInclude,
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return this.toResponse(submission);
  }

  async findPublicBySlug(slug: string): Promise<SubmissionResponseDto> {
    const submission = await this.prisma.submission.findFirst({
      where: {
        slug,
        status: {
          in: [
            SubmissionStatus.PUBLISHED,
            SubmissionStatus.UNDER_REVIEW,
            SubmissionStatus.SHORTLISTED,
            SubmissionStatus.WINNER,
          ],
        },
      },
      include: submissionInclude,
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return this.toResponse(submission);
  }

  async update(
    creatorId: string,
    id: string,
    dto: UpdateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    const existing = await this.getOwnedSubmission(creatorId, id);
    if (existing.status !== SubmissionStatus.DRAFT) {
      throw new BadRequestException('Only draft submissions can be edited');
    }

    if (dto.categoryId) {
      await this.ensureActiveCategory(dto.categoryId);
    }

    const slug =
      dto.title && dto.title.trim() !== existing.title
        ? await this.buildUniqueSlug(dto.title, existing.id)
        : undefined;

    const submission = await this.prisma.$transaction(async (tx) => {
      if (dto.teamMembers) {
        await tx.teamMember.deleteMany({ where: { submissionId: id } });
      }
      if (dto.assets) {
        await tx.asset.deleteMany({ where: { submissionId: id } });
      }

      return tx.submission.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          slug,
          categoryId: dto.categoryId,
          submitterType: dto.submitterType,
          yearCreated: dto.yearCreated,
          concept: dto.concept?.trim(),
          whyNeverLived: dto.whyNeverLived?.trim(),
          rightsAttested: dto.rightsAttested,
          teamMembers: dto.teamMembers
            ? { create: this.mapTeamMembers(dto.teamMembers) }
            : undefined,
          assets: dto.assets
            ? { create: this.mapAssets(dto.assets) }
            : undefined,
        },
        include: submissionInclude,
      });
    });

    return this.toResponse(submission);
  }

  async publish(
    creatorId: string,
    id: string,
  ): Promise<SubmissionResponseDto> {
    const existing = await this.getOwnedSubmission(creatorId, id);
    if (existing.status !== SubmissionStatus.DRAFT) {
      throw new BadRequestException('Only draft submissions can be published');
    }
    if (!existing.rightsAttested) {
      throw new BadRequestException(
        'You must attest you have the right to share this work before publishing',
      );
    }

    const concept = existing.concept.trim();
    const whyNeverLived = existing.whyNeverLived.trim();
    if (concept.length < 20) {
      throw new BadRequestException(
        'Concept must be at least 20 characters before publishing',
      );
    }
    if (whyNeverLived.length < 10) {
      throw new BadRequestException(
        'Why it never lived must be at least 10 characters before publishing',
      );
    }

    const submission = await this.prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: submissionInclude,
    });

    return this.toResponse(submission);
  }

  async remove(creatorId: string, id: string): Promise<{ message: string }> {
    const existing = await this.getOwnedSubmission(creatorId, id);
    if (existing.status !== SubmissionStatus.DRAFT) {
      throw new BadRequestException('Only draft submissions can be deleted');
    }

    await this.prisma.submission.delete({ where: { id } });
    return { message: 'Draft deleted' };
  }

  async adminFindAll(limit = 100): Promise<SubmissionResponseDto[]> {
    const rows = await this.prisma.submission.findMany({
      include: submissionInclude,
      orderBy: { updatedAt: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
    });
    return rows.map((row) => this.toResponse(row));
  }

  async adminUpdate(
    id: string,
    dto: AdminUpdateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    const existing = await this.prisma.submission.findUnique({
      where: { id },
      include: submissionInclude,
    });
    if (!existing) {
      throw new NotFoundException('Submission not found');
    }

    if (!dto.status) {
      return this.toResponse(existing);
    }

    const data: Prisma.SubmissionUpdateInput = { status: dto.status };
    if (
      dto.status === SubmissionStatus.PUBLISHED &&
      !existing.publishedAt
    ) {
      data.publishedAt = new Date();
    }
    if (dto.status === SubmissionStatus.DRAFT) {
      data.publishedAt = null;
    }

    const updated = await this.prisma.submission.update({
      where: { id },
      data,
      include: submissionInclude,
    });
    return this.toResponse(updated);
  }

  async adminBulk(dto: AdminBulkSubmissionsDto): Promise<{ updated: number }> {
    const ids = [...new Set(dto.ids)];

    if (dto.action === 'publish') {
      const result = await this.prisma.submission.updateMany({
        where: {
          id: { in: ids },
          status: {
            in: [
              SubmissionStatus.DRAFT,
              SubmissionStatus.REJECTED,
              SubmissionStatus.ARCHIVED,
            ],
          },
        },
        data: {
          status: SubmissionStatus.PUBLISHED,
          publishedAt: new Date(),
          rightsAttested: true,
        },
      });
      return { updated: result.count };
    }

    if (dto.action === 'unpublish') {
      const result = await this.prisma.submission.updateMany({
        where: {
          id: { in: ids },
          status: {
            notIn: [SubmissionStatus.DRAFT],
          },
        },
        data: { status: SubmissionStatus.REJECTED },
      });
      return { updated: result.count };
    }

    const cycleId = dto.cycleId || (await this.resolveActiveCycleId());
    if (!cycleId) {
      throw new BadRequestException(
        'No active award cycle found. Pass cycleId or create a JUDGING cycle.',
      );
    }

    if (dto.action === 'enter_judging') {
      const result = await this.awardsService.enterSubmissions(cycleId, {
        submissionIds: ids,
      });
      return { updated: result.entered };
    }

    const placement =
      dto.action === 'winners'
        ? AwardPlacement.WINNER
        : AwardPlacement.SHORTLISTED;

    await this.awardsService.publishResults(cycleId, {
      results: ids.map((submissionId) => ({ submissionId, placement })),
      markCyclePublished: dto.markCyclePublished ?? true,
    });

    return { updated: ids.length };
  }

  private async resolveActiveCycleId(): Promise<string | null> {
    const cycle = await this.prisma.awardCycle.findFirst({
      where: {
        status: {
          in: [
            AwardCycleStatus.JUDGING,
            AwardCycleStatus.RESULTS_PUBLISHED,
            AwardCycleStatus.UPCOMING,
          ],
        },
      },
      orderBy: [{ year: 'desc' }, { startsAt: 'desc' }],
    });
    return cycle?.id ?? null;
  }

  private async getOwnedSubmission(creatorId: string, id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    if (submission.creatorId !== creatorId) {
      throw new ForbiddenException('You do not own this submission');
    }
    return submission;
  }

  private async ensureActiveCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
    });
    if (!category) {
      throw new BadRequestException('Invalid or inactive category');
    }
  }

  private async buildUniqueSlug(title: string, excludeId?: string) {
    const base = slugify(title) || 'submission';
    let candidate = base;
    let attempt = 0;

    while (true) {
      const existing = await this.prisma.submission.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      attempt += 1;
      candidate = `${base}-${randomBytes(2).toString('hex')}`;
      if (attempt > 8) {
        candidate = `${base}-${randomBytes(4).toString('hex')}`;
      }
    }
  }

  private mapTeamMembers(members: TeamMemberDto[]) {
    return members.map((member, index) => ({
      name: member.name.trim(),
      roleTitle: member.roleTitle?.trim() || null,
      sortOrder: member.sortOrder ?? index,
    }));
  }

  private mapAssets(assets: AssetDto[]) {
    return assets.map((asset, index) => ({
      type: asset.type,
      url: asset.url,
      fileName: asset.fileName?.trim() || null,
      mimeType: asset.mimeType?.trim() || null,
      sizeBytes: asset.sizeBytes ?? null,
      sortOrder: asset.sortOrder ?? index,
      isCover: asset.isCover ?? index === 0,
    }));
  }

  private toResponse(submission: SubmissionWithRelations): SubmissionResponseDto {
    return {
      id: submission.id,
      title: submission.title,
      slug: submission.slug,
      submitterType: submission.submitterType,
      yearCreated: submission.yearCreated,
      concept: submission.concept,
      whyNeverLived: submission.whyNeverLived,
      rightsAttested: submission.rightsAttested,
      status: submission.status,
      likeCount: submission.likeCount,
      publishedAt: submission.publishedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      category: {
        id: submission.category.id,
        name: submission.category.name,
        slug: submission.category.slug,
      },
      creator: {
        id: submission.creator.id,
        name: submission.creator.name,
        agencyName: submission.creator.agencyName,
        avatarUrl: submission.creator.avatarUrl,
      },
      teamMembers: submission.teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        roleTitle: member.roleTitle,
        sortOrder: member.sortOrder,
      })),
      assets: submission.assets.map((asset) => ({
        id: asset.id,
        type: asset.type,
        url: asset.url,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        sortOrder: asset.sortOrder,
        isCover: asset.isCover,
      })),
    };
  }
}
