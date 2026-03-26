import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuditAction,
  PermissionAction,
  Prisma,
  ResourceType,
} from '@prisma/client';
import { ProjectPermissionsService } from './../permissions.service';
import { CreateProjectRoleDto } from './../dto/role.dto';
import { GrantDirectPermissionDto } from './../dto/role.dto';
import { roleId, permissionId, auditId } from '../../common/id';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  // =========================
  // PROJECT ROLES
  // =========================

  async createRole(
    projectId: string,
    userId: string,
    dto: CreateProjectRoleDto,
  ) {
    await this.permissions.requireOwner(projectId, userId);

    return this.prisma.projectRole.create({
      data: {
        id: roleId(),
        projectId,
        name: dto.name,
        description: dto.description,
        permissions: {
          create: dto.permissions.map((p) => ({
            id: permissionId(),
            resource: p.resource,
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
      ResourceType.PROJECT,
      PermissionAction.READ,
    );

    return this.prisma.projectRole.findMany({
      where: { projectId },
      include: {
        permissions: true,
      },
    });
  }

  async deleteRole(projectId: string, userId: string, roleId: string) {
    await this.permissions.requireOwner(projectId, userId);

    return this.prisma.projectRole.delete({
      where: { id: roleId },
    });
  }

  async getRole(projectId: string, userId: string, roleId: string) {
    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.PROJECT,
      PermissionAction.READ,
    );

    return this.prisma.projectRole.findFirst({
      where: {
        id: roleId,
        projectId,
      },
      include: {
        permissions: true,
        members: {
          include: {
            projectMember: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateRole(
    projectId: string,
    userId: string,
    roleIdValue: string,
    dto: CreateProjectRoleDto,
  ) {
    await this.permissions.requireOwner(projectId, userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.projectRolePermission.deleteMany({
        where: { roleId: roleIdValue },
      });

      const updated = await tx.projectRole.update({
        where: { id: roleIdValue },
        data: {
          name: dto.name,
          description: dto.description ?? null,
          permissions: {
            create: dto.permissions.map((p) => ({
              id: permissionId(),
              resource: p.resource,
              action: p.action,
              scopeId: p.scopeId ?? null,
            })),
          },
        },
        include: {
          permissions: true,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.ROLE_UPDATED,
          entity: 'ProjectRole',
          entityId: roleIdValue,
          details: {
            name: dto.name,
            description: dto.description ?? null,
            permissions: dto.permissions.map((p) => ({
              resource: p.resource,
              action: p.action,
              scopeId: p.scopeId ?? null,
            })),
          } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  // =========================
  // ROLE ASSIGNMENT
  // =========================
  async assignRole(
    projectId: string,
    userId: string,
    memberId: string,
    roleId: string,
  ) {
    await this.permissions.requireOwner(projectId, userId);

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

    return this.prisma.projectMemberRole.deleteMany({
      where: {
        projectMemberId: memberId,
        roleId,
      },
    });
  }

  // =========================
  // DIRECT PERMISSIONS
  // =========================

  async grantPermission(
    projectId: string,
    userId: string,
    memberId: string,
    dto: GrantDirectPermissionDto,
  ) {
    await this.permissions.requireOwner(projectId, userId);

    return this.prisma.projectMemberPermission.create({
      data: {
        id: permissionId(),
        projectMemberId: memberId,
        resource: dto.resource,
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

    return this.prisma.projectMemberPermission.delete({
      where: { id: permissionId },
    });
  }

  // =========================
  // OWNERSHIP
  // =========================

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
