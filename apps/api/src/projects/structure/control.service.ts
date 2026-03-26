import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType } from '@prisma/client';
import { controlId } from '../../common/id';

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

    return this.prisma.control.create({
      data: {
        id: controlId(),
        processId: processIdValue,
        name,
      },
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

    return this.prisma.control.update({
      where: { id: controlIdValue },
      data: { name },
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

    return this.prisma.control.delete({
      where: { id: controlIdValue },
    });
  }
}
