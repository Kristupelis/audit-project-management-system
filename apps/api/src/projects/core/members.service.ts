import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, PermissionAction, ResourceType } from '@prisma/client';
import { ProjectPermissionsService } from './../permissions.service';
import { memberId, permissionId, auditId } from '../../common/id';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  // =========================
  // MEMBERS
  // =========================

  async listMembers(projectId: string, userId: string) {
    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.PROJECT,
      PermissionAction.READ,
    );

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
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
      },
      orderBy: { createdAt: 'asc' },
    });

    const canDeleteMembers = await this.permissions.can(
      projectId,
      userId,
      ResourceType.PROJECT,
      PermissionAction.DELETE,
    );

    return {
      currentUserId: userId,
      canDeleteMembers,
      members,
    };
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

          permissions: {
            create: [
              {
                id: permissionId(),
                resource: ResourceType.PROJECT,
                action: PermissionAction.READ,
                scopeId: null,
              },
              {
                id: permissionId(),
                resource: ResourceType.AUDIT_AREA,
                action: PermissionAction.SEE,
                scopeId: null,
              },
              {
                id: permissionId(),
                resource: ResourceType.PROCESS,
                action: PermissionAction.SEE,
                scopeId: null,
              },
              {
                id: permissionId(),
                resource: ResourceType.CONTROL,
                action: PermissionAction.SEE,
                scopeId: null,
              },
              {
                id: permissionId(),
                resource: ResourceType.TEST_STEP,
                action: PermissionAction.SEE,
                scopeId: null,
              },
              {
                id: permissionId(),
                resource: ResourceType.FINDING,
                action: PermissionAction.SEE,
                scopeId: null,
              },
              {
                id: permissionId(),
                resource: ResourceType.EVIDENCE,
                action: PermissionAction.SEE,
                scopeId: null,
              },
            ],
          },
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
}
