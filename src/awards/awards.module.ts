import { Module } from '@nestjs/common';
import { AwardsController } from './awards.controller';
import { AwardsService } from './awards.service';
import { ShowcaseController } from './showcase.controller';

@Module({
  controllers: [AwardsController, ShowcaseController],
  providers: [AwardsService],
  exports: [AwardsService],
})
export class AwardsModule {}
