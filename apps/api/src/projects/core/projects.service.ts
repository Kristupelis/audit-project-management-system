/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuditAction,
  PermissionAction,
  ResourceType,
  Prisma,
} from '@prisma/client';
import { ProjectPermissionsService } from '../permissions.service';
import { projectId, memberId, auditId } from '../../common/id';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  private mapProjectDates(
    dto: Partial<CreateProjectDto | UpdateProjectDto>,
  ): Prisma.ProjectUncheckedCreateInput | Prisma.ProjectUncheckedUpdateInput {
    return {
      ...dto,
      periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
      periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
      plannedStartDate: dto.plannedStartDate
        ? new Date(dto.plannedStartDate)
        : undefined,
      plannedEndDate: dto.plannedEndDate
        ? new Date(dto.plannedEndDate)
        : undefined,
      actualStartDate: dto.actualStartDate
        ? new Date(dto.actualStartDate)
        : undefined,
      actualEndDate: dto.actualEndDate
        ? new Date(dto.actualEndDate)
        : undefined,
    };
  }

  async createProject(actorId: string, dto: CreateProjectDto) {
    const data = this.mapProjectDates(dto);

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          id: projectId(),
          name: dto.name,
          code: dto.code ?? null,
          description: dto.description ?? null,
          status: dto.status,
          auditType: dto.auditType,
          priority: dto.priority,
          scope: dto.scope ?? null,
          objective: dto.objective ?? null,
          methodology: dto.methodology ?? null,
          auditedEntityName: dto.auditedEntityName ?? null,
          location: dto.location ?? null,
          engagementLead: dto.engagementLead ?? null,
          periodStart:
            'periodStart' in data
              ? (data.periodStart as Date | undefined)
              : undefined,
          periodEnd:
            'periodEnd' in data
              ? (data.periodEnd as Date | undefined)
              : undefined,
          plannedStartDate:
            'plannedStartDate' in data
              ? (data.plannedStartDate as Date | undefined)
              : undefined,
          plannedEndDate:
            'plannedEndDate' in data
              ? (data.plannedEndDate as Date | undefined)
              : undefined,
          actualStartDate:
            'actualStartDate' in data
              ? (data.actualStartDate as Date | undefined)
              : undefined,
          actualEndDate:
            'actualEndDate' in data
              ? (data.actualEndDate as Date | undefined)
              : undefined,
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
              details: dto as unknown as Prisma.InputJsonValue,
            },
          },
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          status: true,
          auditType: true,
          priority: true,
          scope: true,
          objective: true,
          methodology: true,
          auditedEntityName: true,
          location: true,
          engagementLead: true,
          periodStart: true,
          periodEnd: true,
          plannedStartDate: true,
          plannedEndDate: true,
          actualStartDate: true,
          actualEndDate: true,
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
            code: true,
            description: true,
            status: true,
            auditType: true,
            priority: true,
            periodStart: true,
            periodEnd: true,
            plannedStartDate: true,
            plannedEndDate: true,
            actualStartDate: true,
            actualEndDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return memberships.map((m) => ({
      isOwner: m.isOwner,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      roles: m.roles.map((r) => r.role.name),
      ...m.project,
    }));
  }

  async getProjectIfMember(projectIdValue: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: projectIdValue, userId } },
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
            code: true,
            description: true,
            status: true,
            auditType: true,
            priority: true,
            scope: true,
            objective: true,
            methodology: true,
            auditedEntityName: true,
            location: true,
            engagementLead: true,
            periodStart: true,
            periodEnd: true,
            plannedStartDate: true,
            plannedEndDate: true,
            actualStartDate: true,
            actualEndDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!member) throw new ForbiddenException('Not a project member');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      isOwner: member.isOwner,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      roles: member.roles.map((r) => r.role.name),
      ...member.project,
    };
  }

  async updateProject(
    projectIdValue: string,
    userId: string,
    dto: UpdateProjectDto,
  ) {
    await this.permissions.requirePermission(
      projectIdValue,
      userId,
      ResourceType.PROJECT,
      PermissionAction.UPDATE,
    );

    const data = this.mapProjectDates(dto);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: projectIdValue },
        data,
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          status: true,
          auditType: true,
          priority: true,
          scope: true,
          objective: true,
          methodology: true,
          auditedEntityName: true,
          location: true,
          engagementLead: true,
          periodStart: true,
          periodEnd: true,
          plannedStartDate: true,
          plannedEndDate: true,
          actualStartDate: true,
          actualEndDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectIdValue,
          actorId: userId,
          action: AuditAction.PROJECT_UPDATED,
          entity: 'Project',
          entityId: projectIdValue,
          details: dto as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async deleteProject(projectIdValue: string, userId: string) {
    await this.permissions.requireOwner(projectIdValue, userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectIdValue,
          actorId: userId,
          action: AuditAction.PROJECT_DELETED,
          entity: 'Project',
          entityId: projectIdValue,
        },
      });

      await tx.project.delete({
        where: { id: projectIdValue },
      });

      return { success: true };
    });
  }

  async listAudit(
    projectIdValue: string,
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
      projectIdValue,
      userId,
      ResourceType.PROJECT,
      PermissionAction.READ,
    );

    const takeOnly = query?.take ? Number(query.take) : undefined;

    if (takeOnly) {
      const items = await this.prisma.auditLog.findMany({
        where: {
          projectId: projectIdValue,
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
      projectId: projectIdValue,
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
