import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType, AuditAction } from '@prisma/client';
import { processId, auditId } from '../../common/id';

@Injectable()
export class ProcessService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  async resolveProject(processIdValue: string) {
    const process = await this.prisma.process.findUnique({
      where: { id: processIdValue },
      include: {
        auditArea: {
          select: { projectId: true },
        },
      },
    });

    if (!process) throw new NotFoundException('Process not found');

    return process.auditArea.projectId;
  }

  async create(auditAreaId: string, userId: string, name: string) {
    const area = await this.prisma.auditArea.findUnique({
      where: { id: auditAreaId },
      select: { projectId: true },
    });

    if (!area) throw new NotFoundException('Audit area not found');

    await this.permissions.requirePermission(
      area.projectId,
      userId,
      ResourceType.PROCESS,
      PermissionAction.CREATE,
      auditAreaId,
    );

    const last = await this.prisma.process.findFirst({
      where: { auditAreaId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const process = await tx.process.create({
        data: {
          id: processId(),
          auditAreaId,
          name,
          order: nextOrder,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: area.projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.PROCESS_CREATED,
          entity: 'Process',
          entityId: process.id,
          details: { name: name },
        },
      });

      return process;
    });
  }

  async listByAuditArea(auditAreaId: string, userId: string) {
    const area = await this.prisma.auditArea.findUnique({
      where: { id: auditAreaId },
      select: { projectId: true },
    });

    if (!area) throw new NotFoundException('Audit area not found');

    await this.permissions.requirePermission(
      area.projectId,
      userId,
      ResourceType.AUDIT_AREA,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      PermissionAction.SEE,
      auditAreaId,
    );

    return this.prisma.process.findMany({
      where: { auditAreaId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(processIdValue: string, userId: string) {
    const projectId = await this.resolveProject(processIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.PROCESS,
      PermissionAction.READ,
      processIdValue,
    );

    return this.prisma.process.findUnique({
      where: { id: processIdValue },
      include: {
        controls: true,
        evidence: true,
        findings: true,
      },
    });
  }

  async update(processIdValue: string, userId: string, name: string) {
    const projectId = await this.resolveProject(processIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.PROCESS,
      PermissionAction.UPDATE,
      processIdValue,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.process.update({
        where: { id: processIdValue },
        data: { name },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.PROCESS_UPDATED,
          entity: 'Process',
          entityId: processIdValue,
          details: { name: name },
        },
      });

      return updated;
    });
  }

  async delete(processIdValue: string, userId: string) {
    const projectId = await this.resolveProject(processIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.PROCESS,
      PermissionAction.DELETE,
      processIdValue,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.process.delete({ where: { id: processIdValue } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.PROCESS_DELETED,
          entity: 'Process',
          entityId: processIdValue,
        },
      });

      return { success: true };
    });
  }
}
