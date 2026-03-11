import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionAction, ResourceType, SystemRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type ProjectMemberWithPermissions = Prisma.ProjectMemberGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        systemRole: true;
      };
    };
    roles: {
      include: {
        role: {
          include: {
            permissions: true;
          };
        };
      };
    };
    permissions: true;
  };
}>;

@Injectable()
export class ProjectPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembership(
    projectId: string,
    userId: string,
  ): Promise<ProjectMemberWithPermissions> {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            systemRole: true,
          },
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
        permissions: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a project member');
    }

    return member;
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const user: { systemRole: SystemRole } | null =
      await this.prisma.user.findUnique({
        where: { id: userId },
        select: { systemRole: true },
      });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return user?.systemRole === SystemRole.SUPER_ADMIN;
  }

  async can(
    projectId: string,
    userId: string,
    resource: ResourceType,
    action: PermissionAction,
    scopeId?: string,
  ): Promise<boolean> {
    if (await this.isSuperAdmin(userId)) return true;

    const member = await this.getMembership(projectId, userId);

    if (member.isOwner) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const directAllowed = member.permissions.some(
      (p) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        p.resource === resource &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        p.action === action &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (p.scopeId === null || p.scopeId === scopeId),
    );

    if (directAllowed) return true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const roleAllowed = member.roles.some((mr) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mr.role.permissions.some(
        (p) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          p.resource === resource &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          p.action === action &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (p.scopeId === null || p.scopeId === scopeId),
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return roleAllowed;
  }

  async requirePermission(
    projectId: string,
    userId: string,
    resource: ResourceType,
    action: PermissionAction,
    scopeId?: string,
  ): Promise<void> {
    const allowed = await this.can(
      projectId,
      userId,
      resource,
      action,
      scopeId,
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Missing permission: ${action} ${resource}${scopeId ? ` (${scopeId})` : ''}`,
      );
    }
  }

  async requireOwner(projectId: string, userId: string) {
    if (await this.isSuperAdmin(userId)) return;

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { isOwner: true },
    });

    if (!member) throw new ForbiddenException('Not a project member');
    if (!member.isOwner) throw new ForbiddenException('Project owner required');
  }
}
