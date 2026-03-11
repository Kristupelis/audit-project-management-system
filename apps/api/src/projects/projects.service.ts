import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, PermissionAction, ResourceType } from '@prisma/client';
import { ProjectPermissionsService } from './permissions.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  async createProject(actorId: string, name: string, description?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          description: description ?? null,
          members: {
            create: {
              userId: actorId,
              isOwner: true,
            },
          },
          auditLogs: {
            create: {
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return memberships.map((m) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      isOwner: m.isOwner,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      isOwner: member.isOwner,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ResourceType.PROJECT,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

  async addMember(projectId: string, actorId: string, email: string) {
    await this.permissions.requireOwner(projectId, actorId);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: user.id } },
        update: {},
        create: {
          projectId,
          userId: user.id,
          isOwner: false,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          projectId,
          actorId,
          action: AuditAction.MEMBER_ADDED,
          entity: 'ProjectMember',
          entityId: member.id,
          details: { addedUserId: user.id, email },
        },
      });

      return member;
    });
  }

  async listAudit(projectId: string, userId: string) {
    // must be member
    await this.getRole(projectId, userId);

    return this.prisma.auditLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private async getRole(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a project member');
    return member.role;
  }
}
