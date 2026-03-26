/*
  Warnings:

  - The values [PHASE,NODE,TASK,RISK] on the enum `ResourceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ResourceType_new" AS ENUM ('PROJECT', 'AUDIT_AREA', 'PROCESS', 'CONTROL', 'TEST_STEP', 'EVIDENCE', 'FINDING', 'FILE', 'NOTE', 'MEMBER', 'ROLE', 'REPORT');
ALTER TABLE "ProjectRolePermission" ALTER COLUMN "resource" TYPE "ResourceType_new" USING ("resource"::text::"ResourceType_new");
ALTER TABLE "ProjectMemberPermission" ALTER COLUMN "resource" TYPE "ResourceType_new" USING ("resource"::text::"ResourceType_new");
ALTER TYPE "ResourceType" RENAME TO "ResourceType_old";
ALTER TYPE "ResourceType_new" RENAME TO "ResourceType";
DROP TYPE "public"."ResourceType_old";
COMMIT;
