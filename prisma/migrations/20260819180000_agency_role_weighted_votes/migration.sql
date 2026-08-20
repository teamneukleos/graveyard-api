-- Agency role, membership, and weighted votes

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'AGENCY';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "memberOfAgencyId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_memberOfAgencyId_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_memberOfAgencyId_fkey"
      FOREIGN KEY ("memberOfAgencyId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "users_memberOfAgencyId_idx" ON "users"("memberOfAgencyId");

ALTER TABLE "likes" ADD COLUMN IF NOT EXISTS "weight" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "voteScore" INTEGER NOT NULL DEFAULT 0;

UPDATE "submissions"
SET "voteScore" = "likeCount"
WHERE "voteScore" = 0 AND "likeCount" > 0;
