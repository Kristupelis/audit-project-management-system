import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, PermissionAction, ResourceType } from '@prisma/client';
import { ProjectPermissionsService } from './../permissions.service';
import { projectId, memberId, auditId } from '../../common/id';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  // =========================
  // PROJECTS
  // =========================
  async createProject(actorId: string, name: string, description?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          id: projectId(),
          name,
          description: description ?? null,
          members: {
            create: {
              id: memberId(),
              userId: actorId,
              isOwner: true,
            },
          },
          auditLogs: {
            create: {
              id: auditId(),
              actorId,
              action: AuditAction.PROJECT_CREATED,
              entity: 'Project',
              details: { name, description: description ?? null },
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return project;
    });
  }

  async listMyProjects(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      isOwner: m.isOwner,
      roles: m.roles.map((r) => r.role.name),
      ...m.project,
    }));
  }

  async getProjectIfMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!member) throw new ForbiddenException('Not a project member');

    return {
      isOwner: member.isOwner,
      roles: member.roles.map((r) => r.role.name),
      ...member.project,
    };
  }

  async updateProject(
    projectId: string,
    userId: string,
    data: { name?: string; description?: string },
  ) {
    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.PROJECT,
      PermissionAction.UPDATE,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          name: data.name ?? undefined,
          description: data.description ?? undefined,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.PROJECT_UPDATED,
          entity: 'Project',
          entityId: projectId,
          details: data,
        },
      });

      return updated;
    });
  }

  // =========================
  // AUDIT
  // =========================
  async listAudit(
    projectId: string,
    userId: string,
    query?: {
      page?: string;
      pageSize?: string;
      action?: string;
      entity?: string;
      take?: string;
    },
  ) {
    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.PROJECT,
      PermissionAction.READ,
    );

    const takeOnly = query?.take ? Number(query.take) : undefined;

    if (takeOnly) {
      const items = await this.prisma.auditLog.findMany({
        where: {
          projectId,
          ...(query?.action ? { action: query.action as AuditAction } : {}),
          ...(query?.entity ? { entity: query.entity } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: takeOnly,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return {
        items,
        total: items.length,
        page: 1,
        pageSize: takeOnly,
        totalPages: 1,
      };
    }

    const page = Math.max(Number(query?.page ?? 1), 1);
    const pageSize = Math.max(Number(query?.pageSize ?? 30), 1);

    const where = {
      projectId,
      ...(query?.action ? { action: query.action as AuditAction } : {}),
      ...(query?.entity ? { entity: query.entity } : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    };
  }
}
