-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'AUDIT_AREA_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'AUDIT_AREA_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'AUDIT_AREA_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'PROCESS_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'PROCESS_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'PROCESS_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTROL_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTROL_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTROL_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'TEST_STEP_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'TEST_STEP_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'TEST_STEP_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'EVIDENCE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'EVIDENCE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'EVIDENCE_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'FINDING_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'FINDING_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'FINDING_DELETED';
