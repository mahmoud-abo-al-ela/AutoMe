-- Baseline migration: Syncs migration history with database state
-- These changes were previously applied via `prisma db push`
-- This migration is marked as applied to align the migration history

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'PENDING');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ORG_CREATED', 'ORG_UPDATED', 'ORG_DELETED', 'ORG_SUSPENDED', 'ORG_ACTIVATED', 'MEMBER_INVITED', 'MEMBER_ACCEPTED', 'MEMBER_REMOVED', 'MEMBER_ROLE_CHANGED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPGRADED', 'SUBSCRIPTION_DOWNGRADED', 'SUBSCRIPTION_CANCELED', 'SUBSCRIPTION_RENEWED', 'CAR_CREATED', 'CAR_UPDATED', 'CAR_DELETED', 'CAR_STATUS_CHANGED', 'CAR_FEATURED_TOGGLED', 'TEST_DRIVE_CREATED', 'TEST_DRIVE_CONFIRMED', 'TEST_DRIVE_CANCELED', 'TEST_DRIVE_COMPLETED', 'USER_CREATED', 'USER_UPDATED', 'USER_ROLE_CHANGED', 'USER_DELETED', 'WORKING_HOURS_UPDATED', 'ORG_SETTINGS_UPDATED', 'IMPERSONATION_STARTED', 'IMPERSONATION_ENDED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ORGANIZATION', 'USER', 'CAR', 'TEST_DRIVE', 'MEMBERSHIP', 'SUBSCRIPTION', 'WORKING_HOURS', 'IMPERSONATION_SESSION');

-- AlterEnum: Add COMPLETED to TestDriveStatus
ALTER TYPE "TestDriveStatus" ADD VALUE 'COMPLETED';

-- DropTable: Remove old Dealership table
DROP TABLE IF EXISTS "Dealership" CASCADE;

-- CreateTable: Organization
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pendingOwnerEmail" TEXT,
    "theme" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Plan
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "monthlyPrice" INTEGER NOT NULL DEFAULT 0,
    "yearlyPrice" INTEGER NOT NULL DEFAULT 0,
    "stripeProductId" TEXT,
    "stripeMonthlyPriceId" TEXT,
    "stripeYearlyPriceId" TEXT,
    "maxCars" INTEGER NOT NULL DEFAULT 10,
    "maxMembers" INTEGER NOT NULL DEFAULT 1,
    "maxImagesPerCar" INTEGER NOT NULL DEFAULT 5,
    "auditLogRetentionDays" INTEGER,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Subscription
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Membership
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "invitedById" TEXT,
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT,
    "organizationId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "impersonatedBy" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "retainUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ImpersonationSession
CREATE TABLE "ImpersonationSession" (
    "id" TEXT NOT NULL,
    "superAdminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetOrganizationId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add columns to Car
ALTER TABLE "Car" ADD COLUMN "description" TEXT;
ALTER TABLE "Car" ADD COLUMN "features" TEXT[];
ALTER TABLE "Car" ADD COLUMN "location" TEXT;
ALTER TABLE "Car" ADD COLUMN "organizationId" TEXT NOT NULL;
ALTER TABLE "Car" ADD COLUMN "title" TEXT;

-- AlterTable: Add organizationId to TestDrive
ALTER TABLE "TestDrive" ADD COLUMN "organizationId" TEXT NOT NULL;

-- AlterTable: Replace dealershipId with organizationId in WorkingHours
ALTER TABLE "WorkingHours" DROP CONSTRAINT IF EXISTS "WorkingHours_dealershipId_fkey";
DROP INDEX IF EXISTS "WorkingHours_dayOfWeek_dealershipId_key";
DROP INDEX IF EXISTS "WorkingHours_dealershipId_idx";
ALTER TABLE "WorkingHours" DROP COLUMN IF EXISTS "dealershipId";
ALTER TABLE "WorkingHours" ADD COLUMN "organizationId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX "Organization_isActive_idx" ON "Organization"("isActive");

CREATE UNIQUE INDEX "Plan_type_key" ON "Plan"("type");
CREATE UNIQUE INDEX "Plan_stripeProductId_key" ON "Plan"("stripeProductId");
CREATE UNIQUE INDEX "Plan_stripeMonthlyPriceId_key" ON "Plan"("stripeMonthlyPriceId");
CREATE UNIQUE INDEX "Plan_stripeYearlyPriceId_key" ON "Plan"("stripeYearlyPriceId");

CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");
CREATE INDEX "Membership_role_idx" ON "Membership"("role");

CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_retainUntil_idx" ON "AuditLog"("retainUntil");

CREATE INDEX "ImpersonationSession_superAdminId_idx" ON "ImpersonationSession"("superAdminId");
CREATE INDEX "ImpersonationSession_targetUserId_idx" ON "ImpersonationSession"("targetUserId");
CREATE INDEX "ImpersonationSession_targetOrganizationId_idx" ON "ImpersonationSession"("targetOrganizationId");
CREATE INDEX "ImpersonationSession_startedAt_idx" ON "ImpersonationSession"("startedAt");

CREATE INDEX "Car_organizationId_idx" ON "Car"("organizationId");

CREATE INDEX "TestDrive_organizationId_idx" ON "TestDrive"("organizationId");

CREATE UNIQUE INDEX "WorkingHours_dayOfWeek_organizationId_key" ON "WorkingHours"("dayOfWeek", "organizationId");
CREATE INDEX "WorkingHours_organizationId_idx" ON "WorkingHours"("organizationId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_targetOrganizationId_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Car" ADD CONSTRAINT "Car_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
