-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('NGO_SELF_PICKUP', 'VOLUNTEER_DELIVERY');

-- CreateEnum
CREATE TYPE "RescueAssignmentStatus" AS ENUM (
    'OFFERED',
    'ACCEPTED',
    'EN_ROUTE_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'PICKED_UP',
    'EN_ROUTE_TO_NGO',
    'ARRIVED_AT_NGO',
    'DELIVERED',
    'REJECTED',
    'EXPIRED',
    'CANCELLED',
    'FAILED'
);

-- CreateEnum
CREATE TYPE "RescueEventType" AS ENUM (
    'OFFER_CREATED',
    'OFFER_ACCEPTED',
    'OFFER_REJECTED',
    'OFFER_EXPIRED',
    'STATUS_CHANGED',
    'LOCATION_RECEIVED',
    'GEOFENCE_ENTERED',
    'OTP_VERIFIED',
    'DELIVERY_CONFIRMED',
    'SYSTEM_NOTE'
);

-- AlterTable
ALTER TABLE "Donation"
ADD COLUMN "estimatedWeightKg" DOUBLE PRECISION,
ADD COLUMN "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'NGO_SELF_PICKUP';

-- CreateTable
CREATE TABLE "RescueAssignment" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "RescueAssignmentStatus" NOT NULL DEFAULT 'OFFERED',
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "offerExpiresAt" TIMESTAMP(3) NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "ngoLat" DOUBLE PRECISION NOT NULL,
    "ngoLng" DOUBLE PRECISION NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RescueAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RescueEvent" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "sequence" INTEGER NOT NULL,
    "type" "RescueEventType" NOT NULL,
    "fromStatus" "RescueAssignmentStatus",
    "toStatus" "RescueAssignmentStatus",
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RescueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RescueAssignment_donationId_attemptNumber_key"
ON "RescueAssignment"("donationId", "attemptNumber");

-- CreateIndex
CREATE INDEX "RescueAssignment_volunteerId_status_idx"
ON "RescueAssignment"("volunteerId", "status");

-- CreateIndex
CREATE INDEX "RescueAssignment_donationId_status_idx"
ON "RescueAssignment"("donationId", "status");

-- CreateIndex
CREATE INDEX "RescueAssignment_status_offerExpiresAt_idx"
ON "RescueAssignment"("status", "offerExpiresAt");

-- Prevent more than one live volunteer workflow per donation.
CREATE UNIQUE INDEX "RescueAssignment_one_active_per_donation"
ON "RescueAssignment"("donationId")
WHERE "status" IN (
    'OFFERED',
    'ACCEPTED',
    'EN_ROUTE_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'PICKED_UP',
    'EN_ROUTE_TO_NGO',
    'ARRIVED_AT_NGO'
);

-- Prevent one volunteer from accepting multiple active rescues.
CREATE UNIQUE INDEX "RescueAssignment_one_active_per_volunteer"
ON "RescueAssignment"("volunteerId")
WHERE "status" IN (
    'OFFERED',
    'ACCEPTED',
    'EN_ROUTE_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'PICKED_UP',
    'EN_ROUTE_TO_NGO',
    'ARRIVED_AT_NGO'
);

-- CreateIndex
CREATE UNIQUE INDEX "RescueEvent_assignmentId_sequence_key"
ON "RescueEvent"("assignmentId", "sequence");

-- CreateIndex
CREATE INDEX "RescueEvent_assignmentId_createdAt_idx"
ON "RescueEvent"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "RescueEvent_actorUserId_idx"
ON "RescueEvent"("actorUserId");

-- AddForeignKey
ALTER TABLE "RescueAssignment"
ADD CONSTRAINT "RescueAssignment_donationId_fkey"
FOREIGN KEY ("donationId") REFERENCES "Donation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescueAssignment"
ADD CONSTRAINT "RescueAssignment_volunteerId_fkey"
FOREIGN KEY ("volunteerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescueEvent"
ADD CONSTRAINT "RescueEvent_assignmentId_fkey"
FOREIGN KEY ("assignmentId") REFERENCES "RescueAssignment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescueEvent"
ADD CONSTRAINT "RescueEvent_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
