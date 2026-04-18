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
import { findingId, auditId } from '../../common/id';
import { CreateFindingDto, UpdateFindingDto } from '../dto/finding.dto';

@Injectable()
export class FindingService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  private mapDates(dto: Partial<CreateFindingDto | UpdateFindingDto>) {
    return {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      identifiedAt: dto.identifiedAt ? new Date(dto.identifiedAt) : undefined,
      closedAt: dto.closedAt ? new Date(dto.closedAt) : undefined,
    };
  }

  async resolveProject(findingIdValue: string) {
    const e = await this.prisma.finding.findUnique({
      where: { id: findingIdValue },
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

    if (!e) throw new NotFoundException('Finding not found');

    return e.process.auditArea.projectId;
  }

  async create(processIdValue: string, userId: string, dto: CreateFindingDto) {
    const p = await this.prisma.process.findUnique({
      where: { id: processIdValue },
      include: {
        auditArea: {
          select: { projectId: true },
        },
      },
    });

    if (!p) throw new NotFoundException('Process not found');

    await this.permissions.requirePermission(
      p.auditArea.projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.CREATE,
      processIdValue,
    );

    const last = await this.prisma.finding.findFirst({
      where: { processId: processIdValue },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const finding = await tx.finding.create({
        data: {
          id: findingId(),
          processId: processIdValue,
          order: nextOrder,

          title: dto.title,
          description: dto.description,
          severity: dto.severity,

          code: dto.code ?? null,
          criteria: dto.criteria ?? null,
          condition: dto.condition ?? null,
          cause: dto.cause ?? null,
          effect: dto.effect ?? null,
          recommendation: dto.recommendation ?? null,
          managementResponse: dto.managementResponse ?? null,
          actionOwner: dto.actionOwner ?? null,
          status: dto.status,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          identifiedAt: dto.identifiedAt
            ? new Date(dto.identifiedAt)
            : undefined,
          closedAt: dto.closedAt ? new Date(dto.closedAt) : undefined,
          notes: dto.notes ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: p.auditArea.projectId,
          actorId: userId,
          action: AuditAction.FINDING_CREATED,
          entity: 'Finding',
          entityId: finding.id,
          details: dto as unknown as Prisma.InputJsonValue,
        },
      });

      return finding;
    });
  }

  async list(processIdValue: string, userId: string) {
    const p = await this.prisma.process.findUnique({
      where: { id: processIdValue },
      include: {
        auditArea: {
          select: { projectId: true },
        },
      },
    });

    if (!p) throw new NotFoundException('Process not found');

    await this.permissions.requireProjectOpenAccess(
      p.auditArea.projectId,
      userId,
    );

    await this.permissions.requirePermission(
      p.auditArea.projectId,
      userId,
      ResourceType.PROCESS,
      PermissionAction.SEE,
      processIdValue,
    );

    return this.prisma.finding.findMany({
      where: { processId: processIdValue },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(findingIdValue: string, userId: string) {
    const projectId = await this.resolveProject(findingIdValue);

    await this.permissions.requireProjectOpenAccess(projectId, userId);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.READ,
      findingIdValue,
    );

    return this.prisma.finding.findUnique({ where: { id: findingIdValue } });
  }

  async update(findingIdValue: string, userId: string, dto: UpdateFindingDto) {
    const projectId = await this.resolveProject(findingIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.UPDATE,
      findingIdValue,
    );

    const mapped = this.mapDates(dto);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.finding.update({
        where: { id: findingIdValue },
        data: mapped,
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.FINDING_UPDATED,
          entity: 'Finding',
          entityId: findingIdValue,
          details: dto as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async delete(findingIdValue: string, userId: string) {
    const projectId = await this.resolveProject(findingIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.DELETE,
      findingIdValue,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.finding.delete({ where: { id: findingIdValue } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.FINDING_DELETED,
          entity: 'Finding',
          entityId: findingIdValue,
        },
      });

      return { success: true };
    });
  }
}
