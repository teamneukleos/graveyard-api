-- Follow creators / agencies

CREATE TABLE IF NOT EXISTS "follows" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "follows_followerId_followingId_key"
  ON "follows"("followerId", "followingId");

CREATE INDEX IF NOT EXISTS "follows_followingId_idx" ON "follows"("followingId");
CREATE INDEX IF NOT EXISTS "follows_followerId_idx" ON "follows"("followerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'follows_followerId_fkey'
  ) THEN
    ALTER TABLE "follows"
      ADD CONSTRAINT "follows_followerId_fkey"
      FOREIGN KEY ("followerId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'follows_followingId_fkey'
  ) THEN
    ALTER TABLE "follows"
      ADD CONSTRAINT "follows_followingId_fkey"
      FOREIGN KEY ("followingId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
