import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  controllers: [SubmissionsController, AssetsController],
  providers: [SubmissionsService, AssetsService],
  exports: [SubmissionsService, AssetsService],
})
export class SubmissionsModule {}
