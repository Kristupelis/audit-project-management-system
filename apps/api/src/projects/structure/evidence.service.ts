import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType } from '@prisma/client';
import { evidenceId } from '../../common/id';
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

    return this.prisma.evidence.create({
      data: {
        id: evidenceId(),
        processId: processIdValue,
        ...dto,
      },
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
      PermissionAction.READ,
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

    return this.prisma.evidence.update({
      where: { id: evidenceIdValue },
      data: dto,
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

    return this.prisma.evidence.delete({
      where: { id: evidenceIdValue },
    });
  }
}
