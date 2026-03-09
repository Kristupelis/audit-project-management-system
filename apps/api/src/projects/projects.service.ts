import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole, AuditAction } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(actorId: string, name: string, description?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          description: description ?? null,
          members: {
            create: {
              userId: actorId,
              role: ProjectRole.ADMIN,
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
      role: m.role,
      ...m.project,
    }));
  }

  async getProjectIfMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: {
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
    return { role: member.role, ...member.project };
  }

  async updateProject(
    projectId: string,
    userId: string,
    data: { name?: string; description?: string },
  ) {
    const role = await this.getRole(projectId, userId);
    if (role !== ProjectRole.ADMIN && role !== ProjectRole.EDITOR) {
      throw new ForbiddenException('Insufficient permissions');
    }

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

  async addMember(
    projectId: string,
    actorId: string,
    email: string,
    role: ProjectRole,
  ) {
    const actorRole = await this.getRole(projectId, actorId);
    if (actorRole !== ProjectRole.ADMIN)
      throw new ForbiddenException('Admin required');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: user.id } },
        update: { role },
        create: { projectId, userId: user.id, role },
      });

      await tx.auditLog.create({
        data: {
          projectId,
          actorId,
          action: AuditAction.MEMBER_ADDED,
          entity: 'ProjectMember',
          entityId: member.id,
          details: { addedUserId: user.id, email, role },
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
