import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type {
  ObjectStorage,
  StoredObject,
  UploadObjectInput,
} from './storage.types';

export const LOCAL_UPLOAD_ROOT = join(process.cwd(), 'uploads');

@Injectable()
export class LocalStorageService implements ObjectStorage {
  readonly driver = 'local' as const;

  constructor(private readonly config: ConfigService) {
    if (!existsSync(LOCAL_UPLOAD_ROOT)) {
      mkdirSync(LOCAL_UPLOAD_ROOT, { recursive: true });
    }
  }

  async upload(input: UploadObjectInput): Promise<StoredObject> {
    const absolute = join(LOCAL_UPLOAD_ROOT, input.key);
    const dir = dirname(absolute);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(absolute, input.body);
    return { key: input.key, url: this.toPublicUrl(input.key) };
  }

  async delete(keyOrUrl: string): Promise<void> {
    const key = this.toKey(keyOrUrl);
    if (!key) return;
    const absolute = join(LOCAL_UPLOAD_ROOT, key);
    try {
      if (existsSync(absolute)) {
        unlinkSync(absolute);
      }
    } catch {
      // best-effort
    }
  }

  isManagedUrl(url: string): boolean {
    return Boolean(this.toKey(url));
  }

  private toPublicUrl(key: string): string {
    const base = this.publicBaseUrl();
    return `${base}/uploads/${key.replace(/^\/+/, '')}`;
  }

  private toKey(keyOrUrl: string): string | null {
    if (!keyOrUrl.includes('://')) {
      return keyOrUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
    }

    try {
      const parsed = new URL(keyOrUrl);
      if (!parsed.pathname.startsWith('/uploads/')) return null;
      return parsed.pathname.slice('/uploads/'.length);
    } catch {
      return null;
    }
  }

  private publicBaseUrl(): string {
    return (
      this.config.get<string>('PUBLIC_BASE_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }
}
