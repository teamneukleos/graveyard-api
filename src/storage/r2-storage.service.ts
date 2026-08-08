import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ObjectStorage,
  StoredObject,
  UploadObjectInput,
} from './storage.types';

@Injectable()
export class R2StorageService implements ObjectStorage, OnModuleInit {
  readonly driver = 'r2' as const;
  private readonly logger = new Logger(R2StorageService.name);
  private client!: S3Client;
  private bucket!: string;
  private publicBaseUrl!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const driver = (
      this.config.get<string>('STORAGE_DRIVER') ?? 'local'
    ).toLowerCase();
    if (driver !== 'r2') {
      return;
    }

    const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucket = this.config.getOrThrow<string>('R2_BUCKET');
    this.publicBaseUrl = (
      this.config.getOrThrow<string>('R2_PUBLIC_BASE_URL')
    ).replace(/\/$/, '');

    const endpoint =
      this.config.get<string>('R2_ENDPOINT') ??
      `https://${accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`R2 storage ready (bucket: ${this.bucket})`);
  }

  async upload(input: UploadObjectInput): Promise<StoredObject> {
    this.assertReady();
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          ContentLength: input.contentLength,
        }),
      );
    } catch (error) {
      this.logger.error('R2 upload failed', error as Error);
      throw new ServiceUnavailableException('Could not store file in R2');
    }

    return {
      key: input.key,
      url: `${this.publicBaseUrl}/${input.key}`,
    };
  }

  async delete(keyOrUrl: string): Promise<void> {
    if (!this.client) return;
    const key = this.toKey(keyOrUrl);
    if (!key) return;

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.warn(`R2 delete failed for ${key}`, error as Error);
    }
  }

  isManagedUrl(url: string): boolean {
    if (!this.publicBaseUrl) return false;
    return Boolean(this.toKey(url));
  }

  private assertReady() {
    if (!this.client || !this.bucket || !this.publicBaseUrl) {
      throw new ServiceUnavailableException(
        'R2 storage is not configured. Set STORAGE_DRIVER=r2 and R2_* env vars.',
      );
    }
  }

  private toKey(keyOrUrl: string): string | null {
    if (!keyOrUrl.includes('://')) {
      return keyOrUrl.replace(/^\/+/, '');
    }
    const prefix = `${this.publicBaseUrl}/`;
    if (!keyOrUrl.startsWith(prefix)) return null;
    return keyOrUrl.slice(prefix.length);
  }
}
