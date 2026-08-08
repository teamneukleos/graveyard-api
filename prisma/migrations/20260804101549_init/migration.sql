-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CREATOR', 'JUDGE', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubmitterType" AS ENUM ('INDIVIDUAL', 'AGENCY');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'SHORTLISTED', 'WINNER', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'DECK', 'OTHER');

-- CreateEnum
CREATE TYPE "AwardCycleStatus" AS ENUM ('UPCOMING', 'JUDGING', 'RESULTS_PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AwardPlacement" AS ENUM ('SHORTLISTED', 'WINNER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CREATOR',
    "bio" TEXT,
    "agencyName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "submitterType" "SubmitterType" NOT NULL DEFAULT 'INDIVIDUAL',
    "yearCreated" INTEGER NOT NULL,
    "concept" TEXT NOT NULL,
    "whyNeverLived" TEXT NOT NULL,
    "rightsAttested" BOOLEAN NOT NULL DEFAULT false,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleTitle" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_cycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "judgingEndsAt" TIMESTAMP(3),
    "status" "AwardCycleStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "award_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judge_assignments" (
    "id" TEXT NOT NULL,
    "awardCycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "judge_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judge_scores" (
    "id" TEXT NOT NULL,
    "awardCycleId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "concept" INTEGER NOT NULL,
    "craft" INTEGER NOT NULL,
    "story" INTEGER NOT NULL,
    "deservedLife" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judge_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_results" (
    "id" TEXT NOT NULL,
    "awardCycleId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "placement" "AwardPlacement" NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "award_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_items" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "title" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_slug_key" ON "submissions"("slug");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_categoryId_idx" ON "submissions"("categoryId");

-- CreateIndex
CREATE INDEX "submissions_creatorId_idx" ON "submissions"("creatorId");

-- CreateIndex
CREATE INDEX "submissions_yearCreated_idx" ON "submissions"("yearCreated");

-- CreateIndex
CREATE INDEX "submissions_likeCount_idx" ON "submissions"("likeCount");

-- CreateIndex
CREATE INDEX "team_members_submissionId_idx" ON "team_members"("submissionId");

-- CreateIndex
CREATE INDEX "assets_submissionId_idx" ON "assets"("submissionId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE INDEX "likes_createdAt_idx" ON "likes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "likes_submissionId_userId_key" ON "likes"("submissionId", "userId");

-- CreateIndex
CREATE INDEX "award_cycles_status_idx" ON "award_cycles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "award_cycles_year_name_key" ON "award_cycles"("year", "name");

-- CreateIndex
CREATE UNIQUE INDEX "judge_assignments_awardCycleId_userId_key" ON "judge_assignments"("awardCycleId", "userId");

-- CreateIndex
CREATE INDEX "judge_scores_submissionId_idx" ON "judge_scores"("submissionId");

-- CreateIndex
CREATE INDEX "judge_scores_judgeId_idx" ON "judge_scores"("judgeId");

-- CreateIndex
CREATE UNIQUE INDEX "judge_scores_awardCycleId_submissionId_judgeId_key" ON "judge_scores"("awardCycleId", "submissionId", "judgeId");

-- CreateIndex
CREATE INDEX "award_results_categoryId_idx" ON "award_results"("categoryId");

-- CreateIndex
CREATE INDEX "award_results_placement_idx" ON "award_results"("placement");

-- CreateIndex
CREATE UNIQUE INDEX "award_results_awardCycleId_submissionId_key" ON "award_results"("awardCycleId", "submissionId");

-- CreateIndex
CREATE INDEX "featured_items_isActive_sortOrder_idx" ON "featured_items"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_assignments" ADD CONSTRAINT "judge_assignments_awardCycleId_fkey" FOREIGN KEY ("awardCycleId") REFERENCES "award_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_assignments" ADD CONSTRAINT "judge_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_awardCycleId_fkey" FOREIGN KEY ("awardCycleId") REFERENCES "award_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_results" ADD CONSTRAINT "award_results_awardCycleId_fkey" FOREIGN KEY ("awardCycleId") REFERENCES "award_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_results" ADD CONSTRAINT "award_results_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_results" ADD CONSTRAINT "award_results_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_items" ADD CONSTRAINT "featured_items_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
