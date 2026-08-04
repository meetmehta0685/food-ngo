-- Treat LiveEvent as a transactional outbox for Ably publication.
ALTER TABLE "LiveEvent"
ADD COLUMN "ablyPublishedAt" TIMESTAMP(3),
ADD COLUMN "ablyPublishAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "ablyNextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "ablyLastError" TEXT;

-- Historical polling events should not be replayed as new realtime updates.
UPDATE "LiveEvent"
SET "ablyPublishedAt" = "createdAt";

CREATE INDEX "LiveEvent_ablyPublishedAt_ablyNextAttemptAt_id_idx"
ON "LiveEvent"("ablyPublishedAt", "ablyNextAttemptAt", "id");
