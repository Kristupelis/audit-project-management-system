/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import {
  AuditAction,
  PermissionAction,
  Prisma,
  ResourceType,
} from '@prisma/client';
import { evidenceId, auditId } from '../../common/id';
import { CreateEvidenceDto, UpdateEvidenceDto } from '../dto/evidence.dto';

@Injectable()
export class EvidenceService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  private mapDates(dto: Partial<CreateEvidenceDto | UpdateEvidenceDto>) {
    return {
      ...dto,
      collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : undefined,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validTo: dto.validTo ? new Date(dto.validTo) : undefined,
    };
  }

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
      processIdValue,
    );

    const last = await this.prisma.evidence.findFirst({
      where: { processId: processIdValue },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (last?.order ?? -1) + 1;
    const mapped = this.mapDates(dto);

    return this.prisma.$transaction(async (tx) => {
      const evidence = await tx.evidence.create({
        data: {
          id: evidenceId(),
          processId: processIdValue,
          order: nextOrder,
          title: dto.title,
          description: dto.description ?? null,
          type: dto.type,
          source: dto.source ?? null,
          referenceNo: dto.referenceNo ?? null,
          externalUrl: dto.externalUrl ?? null,
          collectedBy: dto.collectedBy ?? null,
          collectedAt: 'collectedAt' in mapped ? mapped.collectedAt : undefined,
          validFrom: 'validFrom' in mapped ? mapped.validFrom : undefined,
          validTo: 'validTo' in mapped ? mapped.validTo : undefined,
          reliabilityLevel: dto.reliabilityLevel,
          confidentiality: dto.confidentiality,
          status: dto.status,
          version: dto.version ?? null,
          notes: dto.notes ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: p.auditArea.projectId,
          actorId: userId,
          action: AuditAction.EVIDENCE_CREATED,
          entity: 'Evidence',
          entityId: evidence.id,
          details: dto as unknown as Prisma.InputJsonValue,
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
      ResourceType.PROCESS,
      PermissionAction.SEE,
      processIdValue,
    );

    return this.prisma.evidence.findMany({
      where: { processId: processIdValue },
      orderBy: { createdAt: 'asc' },
      include: {
        files: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });
  }

  async get(evidenceIdValue: string, userId: string) {
    const projectId = await this.resolveProject(evidenceIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.EVIDENCE,
      PermissionAction.READ,
      evidenceIdValue,
    );

    return this.prisma.evidence.findUnique({
      where: { id: evidenceIdValue },
      include: {
        files: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });
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
      evidenceIdValue,
    );

    const mapped = this.mapDates(dto);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.evidence.update({
        where: { id: evidenceIdValue },
        data: mapped,
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.EVIDENCE_UPDATED,
          entity: 'Evidence',
          entityId: evidenceIdValue,
          details: dto as Prisma.InputJsonValue,
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
      evidenceIdValue,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.evidence.delete({ where: { id: evidenceIdValue } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.EVIDENCE_DELETED,
          entity: 'Evidence',
          entityId: evidenceIdValue,
        },
      });

      return { success: true };
    });
  }
}
