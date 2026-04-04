/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuditAction,
  PermissionAction,
  Prisma,
  ResourceType,
} from '@prisma/client';
import { ProjectPermissionsService } from '../permissions.service';
import { auditAreaId, auditId } from '../../common/id';
import { CreateAuditAreaDto, UpdateAuditAreaDto } from '../dto/audit-area.dto';

@Injectable()
export class AuditAreaService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  async resolveProject(areaId: string) {
    const area = await this.prisma.auditArea.findUnique({
      where: { id: areaId },
      select: { projectId: true },
    });

    if (!area) throw new NotFoundException('Audit area not found');

    return area.projectId;
  }

  async create(projectId: string, userId: string, dto: CreateAuditAreaDto) {
    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.AUDIT_AREA,
      PermissionAction.CREATE,
    );

    const last = await this.prisma.auditArea.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const area = await tx.auditArea.create({
        data: {
          id: auditAreaId(),
          projectId,
          order: nextOrder,
          name: dto.name,
          code: dto.code ?? null,
          description: dto.description ?? null,
          objective: dto.objective ?? null,
          scope: dto.scope ?? null,
          riskLevel: dto.riskLevel,
          residualRisk: dto.residualRisk,
          status: dto.status,
          areaOwner: dto.areaOwner ?? null,
          notes: dto.notes ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.AUDIT_AREA_CREATED,
          entity: 'AuditArea',
          entityId: area.id,
          details: dto as unknown as Prisma.InputJsonValue,
        },
      });

      return area;
    });
  }

  async list(projectId: string, userId: string) {
    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.AUDIT_AREA,
      PermissionAction.SEE,
    );

    return this.prisma.auditArea.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async get(areaId: string, userId: string) {
    const projectId = await this.resolveProject(areaId);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.AUDIT_AREA,
      PermissionAction.READ,
      areaId,
    );

    return this.prisma.auditArea.findUnique({
      where: { id: areaId },
      include: {
        processes: true,
      },
    });
  }

  async update(areaId: string, userId: string, dto: UpdateAuditAreaDto) {
    const projectId = await this.resolveProject(areaId);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.AUDIT_AREA,
      PermissionAction.UPDATE,
      areaId,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.auditArea.update({
        where: { id: areaId },
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          objective: dto.objective,
          scope: dto.scope,
          riskLevel: dto.riskLevel,
          residualRisk: dto.residualRisk,
          status: dto.status,
          areaOwner: dto.areaOwner,
          notes: dto.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.AUDIT_AREA_UPDATED,
          entity: 'AuditArea',
          entityId: areaId,
          details: dto as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async delete(areaId: string, userId: string) {
    const projectId = await this.resolveProject(areaId);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.AUDIT_AREA,
      PermissionAction.DELETE,
      areaId,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.auditArea.delete({ where: { id: areaId } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.AUDIT_AREA_DELETED,
          entity: 'AuditArea',
          entityId: areaId,
        },
      });

      return { success: true };
    });
  }
}
