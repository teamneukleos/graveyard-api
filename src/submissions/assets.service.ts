import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionStatus, type Asset } from '@prisma/client';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../storage/storage.types';
import { AddAssetLinkDto } from './dto/add-asset-link.dto';
import { SubmissionAssetResponseDto } from './dto/submission-response.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

const MAX_BYTES: Record<'IMAGE' | 'VIDEO' | 'PDF', number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 100 * 1024 * 1024,
  PDF: 25 * 1024 * 1024,
};

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async uploadFile(
    creatorId: string,
    submissionId: string,
    file: Express.Multer.File,
    opts?: { isCover?: boolean; sortOrder?: number },
  ): Promise<SubmissionAssetResponseDto> {
    await this.getEditableSubmission(creatorId, submissionId);

    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }

    const type = this.detectUploadType(file.mimetype);
    const max = MAX_BYTES[type];
    if (file.size > max) {
      throw new BadRequestException(
        `File too large for ${type}. Max ${(max / (1024 * 1024)).toFixed(0)}MB`,
      );
    }

    const ext = extname(file.originalname || '').toLowerCase();
    const key = `submissions/${submissionId}/${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;

    const stored = await this.storage.upload({
      key,
      body: file.buffer,
      contentType: file.mimetype,
      contentLength: file.size,
    });

    const count = await this.prisma.asset.count({ where: { submissionId } });
    const isCover = opts?.isCover ?? count === 0;

    if (isCover) {
      await this.prisma.asset.updateMany({
        where: { submissionId, isCover: true },
        data: { isCover: false },
      });
    }

    const asset = await this.prisma.asset.create({
      data: {
        submissionId,
        type,
        url: stored.url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sortOrder: opts?.sortOrder ?? count,
        isCover,
      },
    });

    return this.toResponse(asset);
  }

  async addLink(
    creatorId: string,
    submissionId: string,
    dto: AddAssetLinkDto,
  ): Promise<SubmissionAssetResponseDto> {
    await this.getEditableSubmission(creatorId, submissionId);

    const count = await this.prisma.asset.count({ where: { submissionId } });
    const isCover = dto.isCover ?? count === 0;

    if (isCover) {
      await this.prisma.asset.updateMany({
        where: { submissionId, isCover: true },
        data: { isCover: false },
      });
    }

    const asset = await this.prisma.asset.create({
      data: {
        submissionId,
        type: dto.type,
        url: dto.url,
        fileName: dto.fileName?.trim() || null,
        mimeType: null,
        sizeBytes: null,
        sortOrder: dto.sortOrder ?? count,
        isCover,
      },
    });

    return this.toResponse(asset);
  }

  async update(
    creatorId: string,
    submissionId: string,
    assetId: string,
    dto: UpdateAssetDto,
  ): Promise<SubmissionAssetResponseDto> {
    await this.getEditableSubmission(creatorId, submissionId);
    const asset = await this.getOwnedAsset(submissionId, assetId);

    if (dto.isCover === true) {
      await this.prisma.asset.updateMany({
        where: { submissionId, isCover: true },
        data: { isCover: false },
      });
    }

    const updated = await this.prisma.asset.update({
      where: { id: asset.id },
      data: {
        sortOrder: dto.sortOrder,
        isCover: dto.isCover,
      },
    });

    return this.toResponse(updated);
  }

  async remove(
    creatorId: string,
    submissionId: string,
    assetId: string,
  ): Promise<{ message: string }> {
    await this.getEditableSubmission(creatorId, submissionId);
    const asset = await this.getOwnedAsset(submissionId, assetId);

    await this.prisma.asset.delete({ where: { id: asset.id } });

    if (this.storage.isManagedUrl(asset.url)) {
      await this.storage.delete(asset.url);
    }

    if (asset.isCover) {
      const next = await this.prisma.asset.findFirst({
        where: { submissionId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.asset.update({
          where: { id: next.id },
          data: { isCover: true },
        });
      }
    }

    return { message: 'Asset deleted' };
  }

  private async getEditableSubmission(creatorId: string, submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    if (submission.creatorId !== creatorId) {
      throw new ForbiddenException('You do not own this submission');
    }
    // UI may publish then upload; allow assets until judging starts.
    if (
      submission.status !== SubmissionStatus.DRAFT &&
      submission.status !== SubmissionStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Assets can only be changed on draft or published submissions',
      );
    }
    return submission;
  }

  private async getOwnedAsset(submissionId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, submissionId },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  private detectUploadType(mime: string): 'IMAGE' | 'VIDEO' | 'PDF' {
    if (mime.startsWith('image/')) return 'IMAGE';
    if (mime.startsWith('video/')) return 'VIDEO';
    if (mime === 'application/pdf') return 'PDF';
    throw new BadRequestException(
      'Unsupported file type. Upload an image, video, or PDF. For decks use the link endpoint.',
    );
  }

  private toResponse(asset: Asset): SubmissionAssetResponseDto {
    return {
      id: asset.id,
      type: asset.type,
      url: asset.url,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      sortOrder: asset.sortOrder,
      isCover: asset.isCover,
    };
  }
}
