-- AlterTable
ALTER TABLE "RescueAssignment"
ADD COLUMN "lastLat" DOUBLE PRECISION,
ADD COLUMN "lastLng" DOUBLE PRECISION,
ADD COLUMN "lastAccuracy" DOUBLE PRECISION,
ADD COLUMN "lastLocationAt" TIMESTAMP(3),
ADD COLUMN "lastLocationClientAt" TIMESTAMP(3),
ADD COLUMN "pickupGeofenceEnteredAt" TIMESTAMP(3),
ADD COLUMN "ngoGeofenceEnteredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VolunteerLocationSample" (
    "id" BIGSERIAL NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "clientTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerLocationSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VolunteerLocationSample_assignmentId_createdAt_idx"
ON "VolunteerLocationSample"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "VolunteerLocationSample_volunteerId_createdAt_idx"
ON "VolunteerLocationSample"("volunteerId", "createdAt");

-- AddForeignKey
ALTER TABLE "VolunteerLocationSample"
ADD CONSTRAINT "VolunteerLocationSample_assignmentId_fkey"
FOREIGN KEY ("assignmentId") REFERENCES "RescueAssignment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerLocationSample"
ADD CONSTRAINT "VolunteerLocationSample_volunteerId_fkey"
FOREIGN KEY ("volunteerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
