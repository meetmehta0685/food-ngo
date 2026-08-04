-- AlterTable
ALTER TABLE "RescueAssignment"
ADD COLUMN "pickupOtpHash" TEXT,
ADD COLUMN "pickupOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN "pickupOtpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "pickupOtpGeneratedAt" TIMESTAMP(3),
ADD COLUMN "pickupOtpVerifiedAt" TIMESTAMP(3);
