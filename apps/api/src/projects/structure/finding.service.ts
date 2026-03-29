import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType, AuditAction } from '@prisma/client';
import { findingId, auditId } from '../../common/id';
import { CreateFindingDto, UpdateFindingDto } from '../dto/finding.dto';

@Injectable()
export class FindingService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  async resolveProject(findingIdValue: string) {
    const e = await this.prisma.finding.findUnique({
      where: { id: findingIdValue },
      include: {
        process: {
          include: {
            auditArea: {
              select: { projectId: true },
            },
          },
        },
      },
    });

    if (!e) throw new NotFoundException('Finding not found');

    return e.process.auditArea.projectId;
  }

  async create(processIdValue: string, userId: string, dto: CreateFindingDto) {
    const p = await this.prisma.process.findUnique({
      where: { id: processIdValue },
      include: {
        auditArea: {
          select: { projectId: true },
        },
      },
    });

    if (!p) throw new NotFoundException('Process not found');

    await this.permissions.requirePermission(
      p.auditArea.projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.CREATE,
      processIdValue,
    );

    const last = await this.prisma.finding.findFirst({
      where: { processId: processIdValue },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const finding = await tx.finding.create({
        data: {
          id: findingId(),
          processId: processIdValue,
          ...dto,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          order: nextOrder,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: p.auditArea.projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.FINDING_CREATED,
          entity: 'Finding',
          entityId: finding.id,
          details: { ...dto },
        },
      });

      return finding;
    });
  }

  async list(processIdValue: string, userId: string) {
    const p = await this.prisma.process.findUnique({
      where: { id: processIdValue },
      include: {
        auditArea: {
          select: { projectId: true },
        },
      },
    });

    if (!p) throw new NotFoundException('Process not found');

    await this.permissions.requirePermission(
      p.auditArea.projectId,
      userId,
      ResourceType.PROCESS,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      PermissionAction.SEE,
      processIdValue,
    );

    return this.prisma.finding.findMany({
      where: { processId: processIdValue },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(findingIdValue: string, userId: string) {
    const projectId = await this.resolveProject(findingIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.READ,
      findingIdValue,
    );

    return this.prisma.finding.findUnique({ where: { id: findingIdValue } });
  }

  async update(findingIdValue: string, userId: string, dto: UpdateFindingDto) {
    const projectId = await this.resolveProject(findingIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.UPDATE,
      findingIdValue,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.finding.update({
        where: { id: findingIdValue },
        data: { ...dto },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.FINDING_UPDATED,
          entity: 'Finding',
          entityId: findingIdValue,
          details: { ...dto },
        },
      });

      return updated;
    });
  }

  async delete(findingIdValue: string, userId: string) {
    const projectId = await this.resolveProject(findingIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.DELETE,
      findingIdValue,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.finding.delete({ where: { id: findingIdValue } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.FINDING_DELETED,
          entity: 'Finding',
          entityId: findingIdValue,
        },
      });

      return { success: true };
    });
  }
}
