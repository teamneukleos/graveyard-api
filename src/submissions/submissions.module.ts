import { Module } from '@nestjs/common';
import { AwardsModule } from '../awards/awards.module';
import { AdminSubmissionsController } from './admin-submissions.controller';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [AwardsModule],
  controllers: [
    AdminSubmissionsController,
    SubmissionsController,
    AssetsController,
  ],
  providers: [SubmissionsService, AssetsService],
  exports: [SubmissionsService, AssetsService],
})
export class SubmissionsModule {}
