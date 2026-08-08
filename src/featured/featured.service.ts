import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeaturedDto } from './dto/create-featured.dto';
import { FeaturedItemResponseDto } from './dto/featured-response.dto';
import { UpdateFeaturedDto } from './dto/update-featured.dto';

const PUBLIC_STATUSES: SubmissionStatus[] = [
  SubmissionStatus.PUBLISHED,
  SubmissionStatus.UNDER_REVIEW,
  SubmissionStatus.SHORTLISTED,
  SubmissionStatus.WINNER,
];

const featuredInclude = {
  submission: {
    include: {
      category: { select: { slug: true } },
      creator: { select: { name: true, agencyName: true } },
      assets: {
        where: { isCover: true },
        take: 1,
        select: { url: true },
      },
    },
  },
} satisfies Prisma.FeaturedItemInclude;

type FeaturedWithRelations = Prisma.FeaturedItemGetPayload<{
  include: typeof featuredInclude;
}>;

@Injectable()
export class FeaturedService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(): Promise<FeaturedItemResponseDto[]> {
    const now = new Date();
    const items = await this.prisma.featuredItem.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        submission: { status: { in: PUBLIC_STATUSES } },
      },
      include: featuredInclude,
      orderBy: [{ sortOrder: 'asc' }, { startsAt: 'desc' }],
    });

    return items.map((item) => this.toResponse(item));
  }

  async findAllAdmin(): Promise<FeaturedItemResponseDto[]> {
    const items = await this.prisma.featuredItem.findMany({
      include: featuredInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return items.map((item) => this.toResponse(item));
  }

  async create(dto: CreateFeaturedDto): Promise<FeaturedItemResponseDto> {
    await this.ensurePublicSubmission(dto.submissionId);
    this.assertDateRange(dto.startsAt, dto.endsAt);

    const item = await this.prisma.featuredItem.create({
      data: {
        submissionId: dto.submissionId,
        title: dto.title?.trim() || null,
        startsAt: dto.startsAt ?? new Date(),
        endsAt: dto.endsAt ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: featuredInclude,
    });

    return this.toResponse(item);
  }

  async update(
    id: string,
    dto: UpdateFeaturedDto,
  ): Promise<FeaturedItemResponseDto> {
    const existing = await this.prisma.featuredItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Featured item not found');
    }

    if (dto.submissionId) {
      await this.ensurePublicSubmission(dto.submissionId);
    }

    const startsAt = dto.startsAt ?? existing.startsAt;
    const endsAt =
      dto.endsAt === undefined ? existing.endsAt : dto.endsAt;
    this.assertDateRange(startsAt, endsAt);

    const item = await this.prisma.featuredItem.update({
      where: { id },
      data: {
        submissionId: dto.submissionId,
        title:
          dto.title === undefined
            ? undefined
            : dto.title === null
              ? null
              : dto.title.trim(),
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
      include: featuredInclude,
    });

    return this.toResponse(item);
  }

  async deactivate(id: string): Promise<FeaturedItemResponseDto> {
    const existing = await this.prisma.featuredItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Featured item not found');
    }

    const item = await this.prisma.featuredItem.update({
      where: { id },
      data: { isActive: false },
      include: featuredInclude,
    });

    return this.toResponse(item);
  }

  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.featuredItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Featured item not found');
    }

    await this.prisma.featuredItem.delete({ where: { id } });
    return { message: 'Featured item deleted' };
  }

  private async ensurePublicSubmission(submissionId: string) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        status: { in: PUBLIC_STATUSES },
      },
      select: { id: true },
    });

    if (!submission) {
      throw new BadRequestException(
        'Can only feature a published (public) submission',
      );
    }
  }

  private assertDateRange(startsAt?: Date | null, endsAt?: Date | null) {
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
  }

  private toResponse(item: FeaturedWithRelations): FeaturedItemResponseDto {
    return {
      id: item.id,
      title: item.title,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      submission: {
        id: item.submission.id,
        title: item.submission.title,
        slug: item.submission.slug,
        likeCount: item.submission.likeCount,
        coverUrl: item.submission.assets[0]?.url ?? null,
        categorySlug: item.submission.category.slug,
        creatorName: item.submission.creator.name,
        agencyName: item.submission.creator.agencyName,
      },
    };
  }
}
