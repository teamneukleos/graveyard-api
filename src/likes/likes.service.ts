import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LikeResponseDto } from './dto/like-response.dto';

const PUBLIC_STATUSES: SubmissionStatus[] = [
  SubmissionStatus.PUBLISHED,
  SubmissionStatus.UNDER_REVIEW,
  SubmissionStatus.SHORTLISTED,
  SubmissionStatus.WINNER,
];

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async like(userId: string, submissionId: string): Promise<LikeResponseDto> {
    const submission = await this.getPublicSubmission(submissionId);
    if (submission.creatorId === userId) {
      throw new BadRequestException('You cannot like your own submission');
    }

    const existing = await this.prisma.like.findUnique({
      where: {
        submissionId_userId: { submissionId, userId },
      },
    });

    if (existing) {
      return {
        submissionId,
        liked: true,
        likeCount: submission.likeCount,
      };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: { submissionId, userId },
      });
      return tx.submission.update({
        where: { id: submissionId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
    });

    return {
      submissionId,
      liked: true,
      likeCount: updated.likeCount,
    };
  }

  async unlike(userId: string, submissionId: string): Promise<LikeResponseDto> {
    const submission = await this.getPublicSubmission(submissionId);

    const existing = await this.prisma.like.findUnique({
      where: {
        submissionId_userId: { submissionId, userId },
      },
    });

    if (!existing) {
      return {
        submissionId,
        liked: false,
        likeCount: submission.likeCount,
      };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.like.delete({
        where: { id: existing.id },
      });
      return tx.submission.update({
        where: { id: submissionId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
    });

    return {
      submissionId,
      liked: false,
      likeCount: Math.max(0, updated.likeCount),
    };
  }

  private async getPublicSubmission(submissionId: string) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        status: { in: PUBLIC_STATUSES },
      },
      select: { id: true, creatorId: true, likeCount: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }
}
