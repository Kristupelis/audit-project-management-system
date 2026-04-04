/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Evidence` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Evidence" DROP COLUMN "fileUrl",
ADD COLUMN     "externalUrl" TEXT;
