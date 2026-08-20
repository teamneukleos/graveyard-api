-- Creator/agency entries into award cycles

CREATE TABLE IF NOT EXISTS "award_entries" (
  "id" TEXT NOT NULL,
  "awardCycleId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "enteredById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "award_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "award_entries_awardCycleId_submissionId_key"
  ON "award_entries"("awardCycleId", "submissionId");

CREATE INDEX IF NOT EXISTS "award_entries_submissionId_idx" ON "award_entries"("submissionId");
CREATE INDEX IF NOT EXISTS "award_entries_enteredById_idx" ON "award_entries"("enteredById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'award_entries_awardCycleId_fkey'
  ) THEN
    ALTER TABLE "award_entries"
      ADD CONSTRAINT "award_entries_awardCycleId_fkey"
      FOREIGN KEY ("awardCycleId") REFERENCES "award_cycles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'award_entries_submissionId_fkey'
  ) THEN
    ALTER TABLE "award_entries"
      ADD CONSTRAINT "award_entries_submissionId_fkey"
      FOREIGN KEY ("submissionId") REFERENCES "submissions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'award_entries_enteredById_fkey'
  ) THEN
    ALTER TABLE "award_entries"
      ADD CONSTRAINT "award_entries_enteredById_fkey"
      FOREIGN KEY ("enteredById") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
