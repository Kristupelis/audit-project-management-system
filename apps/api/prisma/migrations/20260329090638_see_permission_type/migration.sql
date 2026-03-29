/*
  Warnings:

  - The values [MANAGE,ASSIGN] on the enum `PermissionAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PermissionAction_new" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'SEE');
ALTER TABLE "ProjectRolePermission" ALTER COLUMN "action" TYPE "PermissionAction_new" USING ("action"::text::"PermissionAction_new");
ALTER TABLE "ProjectMemberPermission" ALTER COLUMN "action" TYPE "PermissionAction_new" USING ("action"::text::"PermissionAction_new");
ALTER TYPE "PermissionAction" RENAME TO "PermissionAction_old";
ALTER TYPE "PermissionAction_new" RENAME TO "PermissionAction";
DROP TYPE "public"."PermissionAction_old";
COMMIT;
