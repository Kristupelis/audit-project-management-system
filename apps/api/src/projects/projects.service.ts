/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, PermissionAction, ResourceType } from '@prisma/client';
import { ProjectPermissionsService } from './permissions.service';
import { CreateProjectRoleDto } from './dto/create-role.dto';
import { GrantDirectPermissionDto } from './dto/grant-direct-permission.dto';
import {
  projectId,
  memberId,
  roleId,
  permissionId,
  auditId,
} from '../common/id';

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

  async addMember(projectId: string, actorId: string, email: string) {
    await this.permissions.requireOwner(projectId, actorId);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: user.id } },
        update: {},
        create: {
          id: memberId(),
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
          id: auditId(),
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

  async removeMember(projectId: string, actorId: string, memberId: string) {
    await this.permissions.requireOwner(projectId, actorId);

    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        projectId: true,
        isOwner: true,
        userId: true,
      },
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Member not found in this project');
    }

    // Prevent removing the last owner
    if (member.isOwner) {
      const owners = await this.prisma.projectMember.count({
        where: {
          projectId,
          isOwner: true,
        },
      });

      if (owners <= 1) {
        throw new ForbiddenException('Cannot remove the last project owner');
      }
    }

    // Prevent from removing themselves - must transfer ownership first
    if (member.userId === actorId) {
      throw new ForbiddenException('Use transfer ownership instead');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({
        where: { id: memberId },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId,
          action: AuditAction.MEMBER_REMOVED,
          entity: 'ProjectMember',
          entityId: memberId,
          details: { removedUserId: member.userId },
        },
      });

      return { success: true };
    });
  }

  async listAudit(projectId: string, userId: string) {
    // must have permission to read project
    await this.permissions.requirePermission(
      projectId,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ResourceType.PROJECT,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      PermissionAction.READ,
    );

    return this.prisma.auditLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createRole(
    projectId: string,
    userId: string,
    dto: CreateProjectRoleDto,
  ) {
    await this.permissions.requireOwner(projectId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.projectRole.create({
      data: {
        id: roleId(),
        projectId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        name: dto.name,
        description: dto.description,
        permissions: {
          create: dto.permissions.map((p) => ({
            id: permissionId(),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            resource: p.resource,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            action: p.action,
            scopeId: p.scopeId ?? null,
          })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  async listRoles(projectId: string, userId: string) {
    await this.permissions.requirePermission(
      projectId,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ResourceType.PROJECT,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      PermissionAction.READ,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return this.prisma.projectRole.findMany({
      where: { projectId },
      include: {
        permissions: true,
      },
    });
  }

  async deleteRole(projectId: string, userId: string, roleId: string) {
    await this.permissions.requireOwner(projectId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return this.prisma.projectRole.delete({
      where: { id: roleId },
    });
  }

  async assignRole(
    projectId: string,
    userId: string,
    memberId: string,
    roleId: string,
  ) {
    await this.permissions.requireOwner(projectId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return this.prisma.projectMemberRole.create({
      data: {
        id: permissionId(),
        projectMemberId: memberId,
        roleId,
      },
    });
  }

  async removeRole(
    projectId: string,
    userId: string,
    memberId: string,
    roleId: string,
  ) {
    await this.permissions.requireOwner(projectId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return this.prisma.projectMemberRole.deleteMany({
      where: {
        projectMemberId: memberId,
        roleId,
      },
    });
  }

  async grantPermission(
    projectId: string,
    userId: string,
    memberId: string,
    dto: GrantDirectPermissionDto,
  ) {
    await this.permissions.requireOwner(projectId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return this.prisma.projectMemberPermission.create({
      data: {
        id: permissionId(),
        projectMemberId: memberId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        resource: dto.resource,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        action: dto.action,
        scopeId: dto.scopeId ?? null,
      },
    });
  }

  async revokePermission(
    projectId: string,
    userId: string,
    memberId: string,
    permissionId: string,
  ) {
    await this.permissions.requireOwner(projectId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return this.prisma.projectMemberPermission.delete({
      where: { id: permissionId },
    });
  }

  async transferOwnership(projectId: string, userId: string, memberId: string) {
    await this.permissions.requireOwner(projectId, userId);

    return this.prisma.projectMember.update({
      where: { id: memberId },
      data: {
        isOwner: true,
      },
    });
  }
}
