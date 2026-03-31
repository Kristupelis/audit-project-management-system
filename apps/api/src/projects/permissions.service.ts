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

type PermissionCandidate = {
  resource: ResourceType;
  scopeId?: string;
};

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

    return user?.systemRole === SystemRole.SUPER_ADMIN;
  }

  private async getHierarchyCandidates(
    resource: ResourceType,
    scopeId?: string,
  ): Promise<PermissionCandidate[]> {
    if (!scopeId) {
      return [{ resource }];
    }

    switch (resource) {
      case ResourceType.AUDIT_AREA:
        return [
          { resource: ResourceType.AUDIT_AREA, scopeId },
          { resource: ResourceType.AUDIT_AREA },
        ];

      case ResourceType.PROCESS: {
        const process = await this.prisma.process.findUnique({
          where: { id: scopeId },
          select: { id: true, auditAreaId: true },
        });

        if (!process) {
          return [
            { resource: ResourceType.PROCESS, scopeId },
            { resource: ResourceType.PROCESS },
          ];
        }

        return [
          { resource: ResourceType.PROCESS, scopeId: process.id },
          { resource: ResourceType.AUDIT_AREA, scopeId: process.auditAreaId },
          { resource: ResourceType.PROCESS },
          { resource: ResourceType.AUDIT_AREA },
        ];
      }

      case ResourceType.CONTROL: {
        const control = await this.prisma.control.findUnique({
          where: { id: scopeId },
          select: {
            id: true,
            processId: true,
            process: {
              select: {
                auditAreaId: true,
              },
            },
          },
        });

        if (!control) {
          return [
            { resource: ResourceType.CONTROL, scopeId },
            { resource: ResourceType.CONTROL },
          ];
        }

        return [
          { resource: ResourceType.CONTROL, scopeId: control.id },
          { resource: ResourceType.PROCESS, scopeId: control.processId },
          {
            resource: ResourceType.AUDIT_AREA,
            scopeId: control.process.auditAreaId,
          },
          { resource: ResourceType.CONTROL },
          { resource: ResourceType.PROCESS },
          { resource: ResourceType.AUDIT_AREA },
        ];
      }

      case ResourceType.TEST_STEP: {
        const step = await this.prisma.testStep.findUnique({
          where: { id: scopeId },
          select: {
            id: true,
            controlId: true,
            control: {
              select: {
                processId: true,
                process: {
                  select: {
                    auditAreaId: true,
                  },
                },
              },
            },
          },
        });

        if (!step) {
          return [
            { resource: ResourceType.TEST_STEP, scopeId },
            { resource: ResourceType.TEST_STEP },
          ];
        }

        return [
          { resource: ResourceType.TEST_STEP, scopeId: step.id },
          { resource: ResourceType.CONTROL, scopeId: step.controlId },
          { resource: ResourceType.PROCESS, scopeId: step.control.processId },
          {
            resource: ResourceType.AUDIT_AREA,
            scopeId: step.control.process.auditAreaId,
          },
          { resource: ResourceType.TEST_STEP },
          { resource: ResourceType.CONTROL },
          { resource: ResourceType.PROCESS },
          { resource: ResourceType.AUDIT_AREA },
        ];
      }

      case ResourceType.FINDING: {
        const finding = await this.prisma.finding.findUnique({
          where: { id: scopeId },
          select: {
            id: true,
            processId: true,
            process: {
              select: {
                auditAreaId: true,
              },
            },
          },
        });

        if (!finding) {
          return [
            { resource: ResourceType.FINDING, scopeId },
            { resource: ResourceType.FINDING },
          ];
        }

        return [
          { resource: ResourceType.FINDING, scopeId: finding.id },
          { resource: ResourceType.PROCESS, scopeId: finding.processId },
          {
            resource: ResourceType.AUDIT_AREA,
            scopeId: finding.process.auditAreaId,
          },
          { resource: ResourceType.FINDING },
          { resource: ResourceType.PROCESS },
          { resource: ResourceType.AUDIT_AREA },
        ];
      }

      case ResourceType.EVIDENCE: {
        const evidence = await this.prisma.evidence.findUnique({
          where: { id: scopeId },
          select: {
            id: true,
            processId: true,
            process: {
              select: {
                auditAreaId: true,
              },
            },
          },
        });

        if (!evidence) {
          return [
            { resource: ResourceType.EVIDENCE, scopeId },
            { resource: ResourceType.EVIDENCE },
          ];
        }

        return [
          { resource: ResourceType.EVIDENCE, scopeId: evidence.id },
          { resource: ResourceType.PROCESS, scopeId: evidence.processId },
          {
            resource: ResourceType.AUDIT_AREA,
            scopeId: evidence.process.auditAreaId,
          },
          { resource: ResourceType.EVIDENCE },
          { resource: ResourceType.PROCESS },
          { resource: ResourceType.AUDIT_AREA },
        ];
      }

      default:
        return [{ resource, scopeId }, { resource }];
    }
  }

  private async getCreateHierarchyCandidates(
    resource: ResourceType,
    scopeId?: string,
  ): Promise<PermissionCandidate[]> {
    if (!scopeId) {
      return [{ resource }];
    }

    switch (resource) {
      case ResourceType.PROCESS: {
        const area = await this.prisma.auditArea.findUnique({
          where: { id: scopeId },
          select: { id: true, projectId: true },
        });

        if (!area) {
          return [
            { resource: ResourceType.PROCESS, scopeId },
            { resource: ResourceType.AUDIT_AREA, scopeId },
            { resource: ResourceType.PROJECT },
            { resource: ResourceType.PROCESS },
            { resource: ResourceType.AUDIT_AREA },
          ];
        }

        return [
          { resource: ResourceType.PROCESS, scopeId: area.id },
          { resource: ResourceType.AUDIT_AREA, scopeId: area.id },
          { resource: ResourceType.PROJECT, scopeId: area.projectId },
          { resource: ResourceType.PROCESS },
          { resource: ResourceType.AUDIT_AREA },
          { resource: ResourceType.PROJECT },
        ];
      }

      case ResourceType.CONTROL:
      case ResourceType.FINDING:
      case ResourceType.EVIDENCE: {
        const process = await this.prisma.process.findUnique({
          where: { id: scopeId },
          select: {
            id: true,
            auditAreaId: true,
            auditArea: {
              select: {
                projectId: true,
              },
            },
          },
        });

        if (!process) {
          return [
            { resource, scopeId },
            { resource: ResourceType.PROCESS, scopeId },
            { resource: ResourceType.AUDIT_AREA },
            { resource: ResourceType.PROJECT },
            { resource },
            { resource: ResourceType.PROCESS },
          ];
        }

        return [
          { resource, scopeId: process.id },
          { resource: ResourceType.PROCESS, scopeId: process.id },
          { resource: ResourceType.AUDIT_AREA, scopeId: process.auditAreaId },
          {
            resource: ResourceType.PROJECT,
            scopeId: process.auditArea.projectId,
          },
          { resource },
          { resource: ResourceType.PROCESS },
          { resource: ResourceType.AUDIT_AREA },
          { resource: ResourceType.PROJECT },
        ];
      }

      case ResourceType.TEST_STEP: {
        const control = await this.prisma.control.findUnique({
          where: { id: scopeId },
          select: {
            id: true,
            processId: true,
            process: {
              select: {
                auditAreaId: true,
                auditArea: {
                  select: {
                    projectId: true,
                  },
                },
              },
            },
          },
        });

        if (!control) {
          return [
            { resource: ResourceType.TEST_STEP, scopeId },
            { resource: ResourceType.CONTROL, scopeId },
            { resource: ResourceType.PROCESS },
            { resource: ResourceType.AUDIT_AREA },
            { resource: ResourceType.PROJECT },
            { resource: ResourceType.TEST_STEP },
            { resource: ResourceType.CONTROL },
          ];
        }

        return [
          { resource: ResourceType.TEST_STEP, scopeId: control.id },
          { resource: ResourceType.CONTROL, scopeId: control.id },
          { resource: ResourceType.PROCESS, scopeId: control.processId },
          {
            resource: ResourceType.AUDIT_AREA,
            scopeId: control.process.auditAreaId,
          },
          {
            resource: ResourceType.PROJECT,
            scopeId: control.process.auditArea.projectId,
          },
          { resource: ResourceType.TEST_STEP },
          { resource: ResourceType.CONTROL },
          { resource: ResourceType.PROCESS },
          { resource: ResourceType.AUDIT_AREA },
          { resource: ResourceType.PROJECT },
        ];
      }

      case ResourceType.AUDIT_AREA:
        return [
          { resource: ResourceType.AUDIT_AREA, scopeId },
          { resource: ResourceType.PROJECT },
          { resource: ResourceType.AUDIT_AREA },
        ];

      default:
        return [{ resource, scopeId }, { resource }];
    }
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

    const candidates =
      action === PermissionAction.CREATE
        ? await this.getCreateHierarchyCandidates(resource, scopeId)
        : await this.getHierarchyCandidates(resource, scopeId);

    const hasPermission = (
      perms: {
        resource: ResourceType;
        action: PermissionAction;
        scopeId: string | null;
      }[],
    ): boolean => {
      return perms.some((p) => {
        if (p.action !== action) return false;

        return candidates.some((candidate) => {
          if (p.resource !== candidate.resource) return false;

          return [candidate.scopeId, projectId, null].includes(p.scopeId);
        });
      });
    };

    if (hasPermission(member.permissions)) {
      return true;
    }

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
