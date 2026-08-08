import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { R2StorageService } from './r2-storage.service';
import { OBJECT_STORAGE, type ObjectStorage } from './storage.types';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageService,
    R2StorageService,
    {
      provide: OBJECT_STORAGE,
      inject: [ConfigService, LocalStorageService, R2StorageService],
      useFactory: (
        config: ConfigService,
        local: LocalStorageService,
        r2: R2StorageService,
      ): ObjectStorage => {
        const driver = (
          config.get<string>('STORAGE_DRIVER') ?? 'local'
        ).toLowerCase();

        if (driver === 'r2') {
          return r2;
        }
        return local;
      },
    },
  ],
  exports: [OBJECT_STORAGE, LocalStorageService, R2StorageService],
})
export class StorageModule {}
