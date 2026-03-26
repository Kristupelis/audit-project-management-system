import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType } from '@prisma/client';
import { processId } from '../../common/id';

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
    );

    return this.prisma.process.create({
      data: {
        id: processId(),
        auditAreaId,
        name,
      },
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
      ResourceType.PROCESS,
      PermissionAction.READ,
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
    );

    return this.prisma.process.update({
      where: { id: processIdValue },
      data: { name },
    });
  }

  async delete(processIdValue: string, userId: string) {
    const projectId = await this.resolveProject(processIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.PROCESS,
      PermissionAction.DELETE,
    );

    return this.prisma.process.delete({
      where: { id: processIdValue },
    });
  }
}
