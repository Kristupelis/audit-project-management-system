/*
  Warnings:

  - You are about to drop the column `role` on the `ProjectMember` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('USER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PROJECT', 'PHASE', 'NODE', 'TASK', 'NOTE', 'FILE', 'FINDING', 'RISK', 'CONTROL', 'EVIDENCE', 'REPORT', 'MEMBER', 'ROLE');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'ASSIGN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'OWNER_TRANSFERRED';
ALTER TYPE "AuditAction" ADD VALUE 'ROLE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ROLE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ROLE_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'DIRECT_PERMISSION_GRANTED';
ALTER TYPE "AuditAction" ADD VALUE 'DIRECT_PERMISSION_REVOKED';

-- AlterTable
ALTER TABLE "ProjectMember" DROP COLUMN "role",
ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "systemRole" "SystemRole" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "ProjectRole";

-- CreateTable
CREATE TABLE "ProjectRole" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resource" "ResourceType" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "scopeId" TEXT,

    CONSTRAINT "ProjectRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMemberRole" (
    "id" TEXT NOT NULL,
    "projectMemberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "ProjectMemberRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMemberPermission" (
    "id" TEXT NOT NULL,
    "projectMemberId" TEXT NOT NULL,
    "resource" "ResourceType" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "scopeId" TEXT,

    CONSTRAINT "ProjectMemberPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRole_projectId_name_key" ON "ProjectRole"("projectId", "name");

-- CreateIndex
CREATE INDEX "ProjectRolePermission_roleId_resource_action_idx" ON "ProjectRolePermission"("roleId", "resource", "action");

-- CreateIndex
CREATE INDEX "ProjectRolePermission_roleId_scopeId_idx" ON "ProjectRolePermission"("roleId", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRolePermission_roleId_resource_action_scopeId_key" ON "ProjectRolePermission"("roleId", "resource", "action", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMemberRole_projectMemberId_roleId_key" ON "ProjectMemberRole"("projectMemberId", "roleId");

-- CreateIndex
CREATE INDEX "ProjectMemberPermission_projectMemberId_resource_action_idx" ON "ProjectMemberPermission"("projectMemberId", "resource", "action");

-- CreateIndex
CREATE INDEX "ProjectMemberPermission_projectMemberId_scopeId_idx" ON "ProjectMemberPermission"("projectMemberId", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMemberPermission_projectMemberId_resource_action_sco_key" ON "ProjectMemberPermission"("projectMemberId", "resource", "action", "scopeId");

-- AddForeignKey
ALTER TABLE "ProjectRole" ADD CONSTRAINT "ProjectRole_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRolePermission" ADD CONSTRAINT "ProjectRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ProjectRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMemberRole" ADD CONSTRAINT "ProjectMemberRole_projectMemberId_fkey" FOREIGN KEY ("projectMemberId") REFERENCES "ProjectMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMemberRole" ADD CONSTRAINT "ProjectMemberRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ProjectRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMemberPermission" ADD CONSTRAINT "ProjectMemberPermission_projectMemberId_fkey" FOREIGN KEY ("projectMemberId") REFERENCES "ProjectMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
