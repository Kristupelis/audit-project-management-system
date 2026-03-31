import {
  /*ForbiddenException,*/
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionAction, ResourceType, AuditAction } from '@prisma/client';
import { ProjectPermissionsService } from '../permissions.service';
import { auditAreaId, auditId } from '../../common/id';

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

  async create(projectId: string, userId: string, name: string) {
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
          name,
          order: nextOrder,
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
          details: { name: name },
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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

  async update(areaId: string, userId: string, name: string) {
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
        data: { name },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          action: AuditAction.AUDIT_AREA_UPDATED,
          entity: 'AuditArea',
          entityId: areaId,
          details: { name: name },
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
          projectId: projectId,
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
