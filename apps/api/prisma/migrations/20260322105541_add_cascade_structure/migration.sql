-- DropForeignKey
ALTER TABLE "AuditArea" DROP CONSTRAINT "AuditArea_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Control" DROP CONSTRAINT "Control_processId_fkey";

-- DropForeignKey
ALTER TABLE "Evidence" DROP CONSTRAINT "Evidence_processId_fkey";

-- DropForeignKey
ALTER TABLE "Finding" DROP CONSTRAINT "Finding_processId_fkey";

-- DropForeignKey
ALTER TABLE "Process" DROP CONSTRAINT "Process_auditAreaId_fkey";

-- DropForeignKey
ALTER TABLE "TestStep" DROP CONSTRAINT "TestStep_controlId_fkey";

-- AddForeignKey
ALTER TABLE "AuditArea" ADD CONSTRAINT "AuditArea_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_auditAreaId_fkey" FOREIGN KEY ("auditAreaId") REFERENCES "AuditArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestStep" ADD CONSTRAINT "TestStep_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;
