import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType, AuditAction } from '@prisma/client';
import { evidenceId, auditId } from '../../common/id';
import { CreateEvidenceDto, UpdateEvidenceDto } from '../dto/evidence.dto';

@Injectable()
export class EvidenceService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  async resolveProject(evidenceIdValue: string) {
    const e = await this.prisma.evidence.findUnique({
      where: { id: evidenceIdValue },
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

    if (!e) throw new NotFoundException('Evidence not found');

    return e.process.auditArea.projectId;
  }

  async create(processIdValue: string, userId: string, dto: CreateEvidenceDto) {
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
      ResourceType.EVIDENCE,
      PermissionAction.CREATE,
    );

    const last = await this.prisma.evidence.findFirst({
      where: { processId: processIdValue },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const evidence = await tx.evidence.create({
        data: {
          id: evidenceId(),
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
          action: AuditAction.EVIDENCE_CREATED,
          entity: 'Evidence',
          entityId: evidence.id,
          details: { ...dto },
        },
      });

      return evidence;
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
      ResourceType.EVIDENCE,
      PermissionAction.SEE,
    );

    return this.prisma.evidence.findMany({
      where: { processId: processIdValue },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(evidenceIdValue: string, userId: string) {
    const projectId = await this.resolveProject(evidenceIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.EVIDENCE,
      PermissionAction.READ,
    );

    return this.prisma.evidence.findUnique({ where: { id: evidenceIdValue } });
  }

  async update(
    evidenceIdValue: string,
    userId: string,
    dto: UpdateEvidenceDto,
  ) {
    const projectId = await this.resolveProject(evidenceIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.EVIDENCE,
      PermissionAction.UPDATE,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.evidence.update({
        where: { id: evidenceIdValue },
        data: { ...dto },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.EVIDENCE_UPDATED,
          entity: 'Evidence',
          entityId: evidenceIdValue,
          details: { ...dto },
        },
      });

      return updated;
    });
  }

  async delete(evidenceIdValue: string, userId: string) {
    const projectId = await this.resolveProject(evidenceIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.EVIDENCE,
      PermissionAction.DELETE,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.evidence.delete({ where: { id: evidenceIdValue } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.EVIDENCE_DELETED,
          entity: 'Evidence',
          entityId: evidenceIdValue,
        },
      });

      return { success: true };
    });
  }
}
