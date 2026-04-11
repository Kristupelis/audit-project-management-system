/*
  Warnings:

  - Added the required column `updatedAt` to the `AuditArea` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Finding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Process` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TestStep` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'FIELDWORK', 'REVIEW', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('INTERNAL', 'EXTERNAL', 'IT', 'FINANCIAL', 'COMPLIANCE', 'OPERATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ControlType" AS ENUM ('PREVENTIVE', 'DETECTIVE', 'CORRECTIVE');

-- CreateEnum
CREATE TYPE "ControlNature" AS ENUM ('MANUAL', 'AUTOMATED', 'IT_DEPENDENT_MANUAL');

-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('AD_HOC', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "TestMethod" AS ENUM ('INQUIRY', 'INSPECTION', 'OBSERVATION', 'REPERFORMANCE', 'WALKTHROUGH', 'ANALYTICAL_PROCEDURE', 'MIXED');

-- CreateEnum
CREATE TYPE "TestStepStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('REQUESTED', 'RECEIVED', 'REVIEWED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReliabilityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ConfidentialityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('DRAFT', 'OPEN', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- AlterTable
ALTER TABLE "AuditArea" ADD COLUMN     "areaOwner" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "objective" TEXT,
ADD COLUMN     "residualRisk" "RiskLevel",
ADD COLUMN     "riskLevel" "RiskLevel",
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "status" "NodeStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Control" ADD COLUMN     "code" TEXT,
ADD COLUMN     "controlNature" "ControlNature",
ADD COLUMN     "controlObjective" TEXT,
ADD COLUMN     "controlOwner" TEXT,
ADD COLUMN     "controlType" "ControlType",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expectedEvidence" TEXT,
ADD COLUMN     "frequency" "FrequencyType",
ADD COLUMN     "keyControl" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "relatedRisk" TEXT,
ADD COLUMN     "status" "NodeStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "testingStrategy" "TestMethod",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "collectedAt" TIMESTAMP(3),
ADD COLUMN     "collectedBy" TEXT,
ADD COLUMN     "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "referenceNo" TEXT,
ADD COLUMN     "reliabilityLevel" "ReliabilityLevel",
ADD COLUMN     "source" TEXT,
ADD COLUMN     "status" "EvidenceStatus" NOT NULL DEFAULT 'REQUESTED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validFrom" TIMESTAMP(3),
ADD COLUMN     "validTo" TIMESTAMP(3),
ADD COLUMN     "version" TEXT;

-- AlterTable
ALTER TABLE "Finding" ADD COLUMN     "actionOwner" TEXT,
ADD COLUMN     "cause" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "code" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "criteria" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "effect" TEXT,
ADD COLUMN     "identifiedAt" TIMESTAMP(3),
ADD COLUMN     "managementResponse" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recommendation" TEXT,
ADD COLUMN     "status" "FindingStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Process" ADD COLUMN     "code" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "frequency" "FrequencyType",
ADD COLUMN     "keyInputs" TEXT,
ADD COLUMN     "keyOutputs" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "objective" TEXT,
ADD COLUMN     "processOwner" TEXT,
ADD COLUMN     "riskLevel" "RiskLevel",
ADD COLUMN     "status" "NodeStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "systemsInvolved" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "actualEndDate" TIMESTAMP(3),
ADD COLUMN     "actualStartDate" TIMESTAMP(3),
ADD COLUMN     "auditType" "AuditType" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "auditedEntityName" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "engagementLead" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "methodology" TEXT,
ADD COLUMN     "objective" TEXT,
ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3),
ADD COLUMN     "plannedEndDate" TIMESTAMP(3),
ADD COLUMN     "plannedStartDate" TIMESTAMP(3),
ADD COLUMN     "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE "TestStep" ADD COLUMN     "actualResult" TEXT,
ADD COLUMN     "expectedResult" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "performedAt" TIMESTAMP(3),
ADD COLUMN     "performedBy" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "sampleReference" TEXT,
ADD COLUMN     "status" "TestStepStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "stepNo" INTEGER,
ADD COLUMN     "testMethod" "TestMethod",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
