import {
  /*ForbiddenException,*/
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionAction, ResourceType } from '@prisma/client';
import { ProjectPermissionsService } from '../permissions.service';
import { auditAreaId /*, auditId*/ } from '../../common/id';

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

    return this.prisma.auditArea.create({
      data: {
        id: auditAreaId(),
        projectId,
        name,
      },
    });
  }

  async list(projectId: string, userId: string) {
    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.AUDIT_AREA,
      PermissionAction.READ,
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
    );

    return this.prisma.auditArea.update({
      where: { id: areaId },
      data: { name },
    });
  }

  async delete(areaId: string, userId: string) {
    const projectId = await this.resolveProject(areaId);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.AUDIT_AREA,
      PermissionAction.DELETE,
    );

    return this.prisma.auditArea.delete({
      where: { id: areaId },
    });
  }
}
