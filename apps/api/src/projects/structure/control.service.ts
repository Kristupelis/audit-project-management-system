import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType, AuditAction } from '@prisma/client';
import { controlId, auditId } from '../../common/id';

@Injectable()
export class ControlService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  async resolveProject(controlIdValue: string) {
    const control = await this.prisma.control.findUnique({
      where: { id: controlIdValue },
      include: {
        process: {
          include: {
            auditArea: {
              select: { projectId: true },
            },
          },
        },
      },
    });

    if (!control) throw new NotFoundException('Control not found');

    return control.process.auditArea.projectId;
  }

  async create(processIdValue: string, userId: string, name: string) {
    const process = await this.prisma.process.findUnique({
      where: { id: processIdValue },
      include: {
        auditArea: {
          select: { projectId: true },
        },
      },
    });

    if (!process) throw new NotFoundException('Process not found');

    await this.permissions.requirePermission(
      process.auditArea.projectId,
      userId,
      ResourceType.CONTROL,
      PermissionAction.CREATE,
    );

    const last = await this.prisma.control.findFirst({
      where: { processId: processIdValue },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const control = await tx.control.create({
        data: {
          id: controlId(),
          processId: processIdValue,
          name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          order: nextOrder,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: process.auditArea.projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.CONTROL_CREATED,
          entity: 'Control',
          entityId: control.id,
          details: { name: name },
        },
      });

      return control;
    });
  }

  async listByProcess(processIdValue: string, userId: string) {
    const process = await this.prisma.process.findUnique({
      where: { id: processIdValue },
      include: {
        auditArea: {
          select: { projectId: true },
        },
      },
    });

    if (!process) throw new NotFoundException('Process not found');

    await this.permissions.requirePermission(
      process.auditArea.projectId,
      userId,
      ResourceType.CONTROL,
      PermissionAction.READ,
    );

    return this.prisma.control.findMany({
      where: { processId: processIdValue },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(controlIdValue: string, userId: string) {
    const projectId = await this.resolveProject(controlIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.CONTROL,
      PermissionAction.READ,
    );

    return this.prisma.control.findUnique({
      where: { id: controlIdValue },
      include: {
        testSteps: true,
      },
    });
  }

  async update(controlIdValue: string, userId: string, name: string) {
    const projectId = await this.resolveProject(controlIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.CONTROL,
      PermissionAction.UPDATE,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.control.update({
        where: { id: controlIdValue },
        data: { name },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.CONTROL_UPDATED,
          entity: 'Control',
          entityId: controlIdValue,
          details: { name: name },
        },
      });

      return updated;
    });
  }

  async delete(controlIdValue: string, userId: string) {
    const projectId = await this.resolveProject(controlIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.CONTROL,
      PermissionAction.DELETE,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.control.delete({ where: { id: controlIdValue } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.CONTROL_DELETED,
          entity: 'Control',
          entityId: controlIdValue,
        },
      });

      return { success: true };
    });
  }
}
