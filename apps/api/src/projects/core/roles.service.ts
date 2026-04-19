import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    await this.permissions.requireCanManageMembers(projectId, userId);

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.projectRole.create({
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

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.ROLE_CREATED,
          entity: 'ProjectRole',
          entityId: created.id,
          details: {
            name: created.name,
            description: created.description,
            permissions: created.permissions.map((p) => ({
              resource: p.resource,
              action: p.action,
              scopeId: p.scopeId,
            })),
          } as Prisma.InputJsonValue,
        },
      });

      return created;
    });
  }

  async listRoles(projectId: string, userId: string) {
    await this.permissions.requireProjectOpenAccess(projectId, userId);

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

  async deleteRole(projectId: string, userId: string, roleIdValue: string) {
    await this.permissions.requireCanManageMembers(projectId, userId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.projectRole.findFirst({
        where: {
          id: roleIdValue,
          projectId,
        },
        include: {
          permissions: true,
          members: {
            select: {
              id: true,
              projectMemberId: true,
            },
          },
        },
      });

      if (!existing) {
        throw new NotFoundException('Role not found in this project');
      }

      await tx.projectRole.delete({
        where: { id: roleIdValue },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.ROLE_DELETED,
          entity: 'ProjectRole',
          entityId: roleIdValue,
          details: {
            name: existing.name,
            description: existing.description,
            memberCount: existing.members.length,
            permissions: existing.permissions.map((p) => ({
              resource: p.resource,
              action: p.action,
              scopeId: p.scopeId,
            })),
          } as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  }

  async getRole(projectId: string, userId: string, roleId: string) {
    await this.permissions.requireProjectOpenAccess(projectId, userId);

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
    await this.permissions.requireCanManageMembers(projectId, userId);

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
    memberIdValue: string,
    roleIdValue: string,
  ) {
    await this.permissions.requireCanManageMembers(projectId, userId);

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.findFirst({
        where: {
          id: memberIdValue,
          projectId,
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

      if (!member) {
        throw new NotFoundException('Member not found in this project');
      }

      const role = await tx.projectRole.findFirst({
        where: {
          id: roleIdValue,
          projectId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found in this project');
      }

      const assignment = await tx.projectMemberRole.create({
        data: {
          id: permissionId(),
          projectMemberId: memberIdValue,
          roleId: roleIdValue,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.ROLE_ASSIGNED_TO_MEMBER,
          entity: 'ProjectMemberRole',
          entityId: assignment.id,
          details: {
            memberId: member.id,
            memberUserId: member.user.id,
            memberEmail: member.user.email,
            roleId: role.id,
            roleName: role.name,
          } as Prisma.InputJsonValue,
        },
      });

      return assignment;
    });
  }

  async removeRole(
    projectId: string,
    userId: string,
    memberIdValue: string,
    roleIdValue: string,
  ) {
    await this.permissions.requireCanManageMembers(projectId, userId);

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.findFirst({
        where: {
          id: memberIdValue,
          projectId,
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

      if (!member) {
        throw new NotFoundException('Member not found in this project');
      }

      const role = await tx.projectRole.findFirst({
        where: {
          id: roleIdValue,
          projectId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found in this project');
      }

      const existing = await tx.projectMemberRole.findFirst({
        where: {
          projectMemberId: memberIdValue,
          roleId: roleIdValue,
        },
        select: {
          id: true,
        },
      });

      if (!existing) {
        throw new NotFoundException('Role assignment not found');
      }

      await tx.projectMemberRole.delete({
        where: { id: existing.id },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.ROLE_REMOVED_FROM_MEMBER,
          entity: 'ProjectMemberRole',
          entityId: existing.id,
          details: {
            memberId: member.id,
            memberUserId: member.user.id,
            memberEmail: member.user.email,
            roleId: role.id,
            roleName: role.name,
          } as Prisma.InputJsonValue,
        },
      });

      return { success: true };
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
    await this.permissions.requireCanManageMembers(projectId, userId);

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
    await this.permissions.requireCanManageMembers(projectId, userId);

    return this.prisma.projectMemberPermission.delete({
      where: { id: permissionId },
    });
  }

  // =========================
  // OWNERSHIP
  // =========================

  async transferOwnership(projectId: string, userId: string, memberId: string) {
    await this.permissions.requireCanManageMembers(projectId, userId);

    return this.prisma.$transaction(async (tx) => {
      const targetMember = await tx.projectMember.findFirst({
        where: {
          id: memberId,
          projectId,
        },
        select: {
          id: true,
          userId: true,
          isOwner: true,
        },
      });

      if (!targetMember) {
        throw new NotFoundException('Target member not found in this project');
      }

      if (await this.permissions.isSuperAdmin(userId)) {
        await tx.projectMember.update({
          where: { id: targetMember.id },
          data: { isOwner: true },
        });

        await tx.auditLog.create({
          data: {
            id: auditId(),
            projectId,
            actorId: userId,
            action: AuditAction.OWNER_TRANSFERRED,
            entity: 'ProjectMember',
            entityId: targetMember.id,
            details: {
              targetMemberId: targetMember.id,
              targetUserId: targetMember.userId,
              mode: 'super_admin_promote_owner',
            } as Prisma.InputJsonValue,
          },
        });

        return { success: true };
      }

      const currentOwner = await tx.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { id: true, userId: true, isOwner: true },
      });

      if (!currentOwner || !currentOwner.isOwner) {
        throw new NotFoundException('Current owner not found');
      }

      /* Atkomentuot, jei noresiu, kad owneris gali but tik vienas
      await tx.projectMember.update({
        where: { id: currentOwner.id },
        data: { isOwner: false },
      });
      */

      await tx.projectMember.update({
        where: { id: targetMember.id },
        data: { isOwner: true },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.OWNER_TRANSFERRED,
          entity: 'ProjectMember',
          entityId: targetMember.id,
          details: {
            fromUserId: currentOwner.userId,
            toUserId: targetMember.userId,
            fromMemberId: currentOwner.id,
            toMemberId: targetMember.id,
          } as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  }

  async removeOwnership(projectId: string, userId: string, memberId: string) {
    await this.permissions.requireCanManageMembers(projectId, userId);

    return this.prisma.$transaction(async (tx) => {
      const targetMember = await tx.projectMember.findFirst({
        where: {
          id: memberId,
          projectId,
        },
        select: {
          id: true,
          userId: true,
          isOwner: true,
        },
      });

      if (!targetMember) {
        throw new NotFoundException('Target member not found in this project');
      }

      if (!targetMember.isOwner) {
        throw new NotFoundException('Target member is not an owner');
      }

      const ownerCount = await tx.projectMember.count({
        where: {
          projectId,
          isOwner: true,
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException(
          'Cannot remove ownership from the last project owner',
        );
      }

      await tx.projectMember.update({
        where: { id: targetMember.id },
        data: { isOwner: false },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.OWNER_TRANSFERRED,
          entity: 'ProjectMember',
          entityId: targetMember.id,
          details: {
            targetMemberId: targetMember.id,
            targetUserId: targetMember.userId,
            mode: 'ownership_removed',
          } as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  }
}
