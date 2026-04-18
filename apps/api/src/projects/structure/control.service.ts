/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import {
  AuditAction,
  PermissionAction,
  Prisma,
  ResourceType,
} from '@prisma/client';
import { controlId, auditId } from '../../common/id';
import { CreateControlDto, UpdateControlDto } from '../dto/control.dto';

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

  async create(processIdValue: string, userId: string, dto: CreateControlDto) {
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
      processIdValue,
    );

    const last = await this.prisma.control.findFirst({
      where: { processId: processIdValue },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const control = await tx.control.create({
        data: {
          id: controlId(),
          processId: processIdValue,
          order: nextOrder,
          name: dto.name,
          code: dto.code ?? null,
          description: dto.description ?? null,
          controlObjective: dto.controlObjective ?? null,
          controlType: dto.controlType,
          controlNature: dto.controlNature,
          controlOwner: dto.controlOwner ?? null,
          frequency: dto.frequency,
          keyControl: dto.keyControl ?? false,
          relatedRisk: dto.relatedRisk ?? null,
          expectedEvidence: dto.expectedEvidence ?? null,
          testingStrategy: dto.testingStrategy,
          status: dto.status,
          notes: dto.notes ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: process.auditArea.projectId,
          actorId: userId,
          action: AuditAction.CONTROL_CREATED,
          entity: 'Control',
          entityId: control.id,
          details: dto as unknown as Prisma.InputJsonValue,
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

    await this.permissions.requireProjectOpenAccess(
      process.auditArea.projectId,
      userId,
    );

    await this.permissions.requirePermission(
      process.auditArea.projectId,
      userId,
      ResourceType.PROCESS,
      PermissionAction.SEE,
      processIdValue,
    );

    return this.prisma.control.findMany({
      where: { processId: processIdValue },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(controlIdValue: string, userId: string) {
    const projectId = await this.resolveProject(controlIdValue);

    await this.permissions.requireProjectOpenAccess(projectId, userId);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.CONTROL,
      PermissionAction.READ,
      controlIdValue,
    );

    return this.prisma.control.findUnique({
      where: { id: controlIdValue },
      include: {
        testSteps: true,
      },
    });
  }

  async update(controlIdValue: string, userId: string, dto: UpdateControlDto) {
    const projectId = await this.resolveProject(controlIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.CONTROL,
      PermissionAction.UPDATE,
      controlIdValue,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.control.update({
        where: { id: controlIdValue },
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          controlObjective: dto.controlObjective,
          controlType: dto.controlType,
          controlNature: dto.controlNature,
          controlOwner: dto.controlOwner,
          frequency: dto.frequency,
          keyControl: dto.keyControl,
          relatedRisk: dto.relatedRisk,
          expectedEvidence: dto.expectedEvidence,
          testingStrategy: dto.testingStrategy,
          status: dto.status,
          notes: dto.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.CONTROL_UPDATED,
          entity: 'Control',
          entityId: controlIdValue,
          details: dto as Prisma.InputJsonValue,
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
      controlIdValue,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.control.delete({ where: { id: controlIdValue } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.CONTROL_DELETED,
          entity: 'Control',
          entityId: controlIdValue,
        },
      });

      return { success: true };
    });
  }
}
