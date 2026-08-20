import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionStatus, UserRole } from '@prisma/client';
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
    const voter = await this.requireVerifiedVoter(userId);
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
        voteScore: submission.voteScore,
      };
    }

    const weight = voteWeightForRole(voter.role);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: { submissionId, userId, weight },
      });
      return tx.submission.update({
        where: { id: submissionId },
        data: {
          likeCount: { increment: 1 },
          voteScore: { increment: weight },
        },
        select: { likeCount: true, voteScore: true },
      });
    });

    return {
      submissionId,
      liked: true,
      likeCount: updated.likeCount,
      voteScore: updated.voteScore,
    };
  }

  async unlike(userId: string, submissionId: string): Promise<LikeResponseDto> {
    await this.requireVerifiedVoter(userId);
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
        voteScore: submission.voteScore,
      };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.like.delete({
        where: { id: existing.id },
      });
      return tx.submission.update({
        where: { id: submissionId },
        data: {
          likeCount: { decrement: 1 },
          voteScore: { decrement: existing.weight },
        },
        select: { likeCount: true, voteScore: true },
      });
    });

    return {
      submissionId,
      liked: false,
      likeCount: Math.max(0, updated.likeCount),
      voteScore: Math.max(0, updated.voteScore),
    };
  }

  private async requireVerifiedVoter(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true, role: true, agencyName: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Verify your email to vote');
    }
    if (user.role === UserRole.AGENCY && !user.agencyName?.trim()) {
      throw new ForbiddenException('Complete agency onboarding to vote');
    }
    return user;
  }

  private async getPublicSubmission(submissionId: string) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        status: { in: PUBLIC_STATUSES },
      },
      select: {
        id: true,
        creatorId: true,
        likeCount: true,
        voteScore: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }
}

function voteWeightForRole(role: UserRole): number {
  if (role === UserRole.JUDGE) return 5;
  if (role === UserRole.AGENCY) return 3;
  return 1;
}
