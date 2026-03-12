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

  private membershipCache = new Map<string, ProjectMemberWithPermissions>();

  async getMembership(
    projectId: string,
    userId: string,
  ): Promise<ProjectMemberWithPermissions> {
    const cacheKey = `${projectId}:${userId}`;

    const cached = this.membershipCache.get(cacheKey);
    if (cached) return cached;

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

    this.membershipCache.set(cacheKey, member);
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

    const scopes: (string | null | undefined)[] = [
      scopeId, // exact scope
      projectId, // project-level scope
      null, // global
    ];

    const hasPermission = (
      perms: {
        resource: ResourceType;
        action: PermissionAction;
        scopeId: string | null;
      }[],
    ): boolean => {
      return perms.some(
        (p) =>
          p.resource === resource &&
          p.action === action &&
          scopes.includes(p.scopeId),
      );
    };

    // Direct permissions
    if (hasPermission(member.permissions)) {
      return true;
    }

    // Role permissions
    for (const mr of member.roles) {
      if (hasPermission(mr.role.permissions)) {
        return true;
      }
    }

    return false;
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
