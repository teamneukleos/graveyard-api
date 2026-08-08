import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AwardsModule } from './awards/awards.module';
import { CategoriesModule } from './categories/categories.module';
import { FeaturedModule } from './featured/featured.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LikesModule } from './likes/likes.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    SubmissionsModule,
    LikesModule,
    LeaderboardModule,
    FeaturedModule,
    AwardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

