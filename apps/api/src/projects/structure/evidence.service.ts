/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import {
  AuditAction,
  FileScanStatus,
  FileStorageProvider,
  PermissionAction,
  Prisma,
  ResourceType,
} from '@prisma/client';
import { evidenceId, auditId, evidenceFileId } from '../../common/id';
import { CreateEvidenceDto, UpdateEvidenceDto } from '../dto/evidence.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Express } from 'express';
import * as fsSync from 'fs';

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

  private async ensureUploadDir(): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', 'evidence');
    await fs.mkdir(uploadDir, { recursive: true });
    return uploadDir;
  }

  private getFileExtension(filename: string): string | null {
    const ext = path.extname(filename).trim();
    return ext ? ext.toLowerCase() : null;
  }

  private async sha256FromBuffer(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private buildStoredFileName(originalName: string, checksum: string): string {
    const extension = this.getFileExtension(originalName) ?? '';
    const safeChecksum = checksum.slice(0, 16);
    return `evidence-${Date.now()}-${safeChecksum}${extension}`;
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

  async uploadFile(
    evidenceIdValue: string,
    userId: string,
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const projectId = await this.resolveProject(evidenceIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.EVIDENCE,
      PermissionAction.UPDATE,
      evidenceIdValue,
    );

    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceIdValue },
      select: { id: true },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    const uploadDir = await this.ensureUploadDir();

    const tempPath = file.path;
    const fileBuffer = await fs.readFile(tempPath);
    const checksum = await this.sha256FromBuffer(fileBuffer);
    const storedName = this.buildStoredFileName(file.originalname, checksum);
    const finalPath = path.join(uploadDir, storedName);

    await fs.rename(tempPath, finalPath);

    return this.prisma.evidenceFile.create({
      data: {
        id: evidenceFileId(),
        evidenceId: evidenceIdValue,
        originalName: file.originalname,
        storedName,
        storagePath: finalPath,
        storageProvider: FileStorageProvider.LOCAL,
        mimeType: file.mimetype || null,
        extension: this.getFileExtension(file.originalname),
        sizeBytes: file.size,
        checksumSha256: checksum,
        uploadedByUserId: userId,
        scanStatus: FileScanStatus.SKIPPED,
        scanEngine: null,
        scanResult: null,
      },
    });
  }

  async getDownloadFile(fileId: string, userId: string) {
    const file = await this.prisma.evidenceFile.findUnique({
      where: { id: fileId },
      include: {
        evidence: {
          include: {
            process: {
              include: {
                auditArea: {
                  select: { projectId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!file || file.isDeleted) {
      throw new NotFoundException('File not found');
    }

    const projectId = file.evidence.process.auditArea.projectId;

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.EVIDENCE,
      PermissionAction.READ,
      file.evidenceId,
    );

    try {
      await fs.access(file.storagePath);
    } catch {
      throw new NotFoundException('Stored file not found on disk');
    }

    return {
      originalName: file.originalName,
      mimeType: file.mimeType,
      absolutePath: file.storagePath,
    };
  }

  async deleteFile(fileId: string, userId: string) {
    const file = await this.prisma.evidenceFile.findUnique({
      where: { id: fileId },
      include: {
        evidence: {
          include: {
            process: {
              include: {
                auditArea: {
                  select: { projectId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!file || file.isDeleted) {
      throw new NotFoundException('File not found');
    }

    const projectId = file.evidence.process.auditArea.projectId;

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.EVIDENCE,
      PermissionAction.UPDATE,
      file.evidenceId,
    );

    try {
      if (fsSync.existsSync(file.storagePath)) {
        await fs.unlink(file.storagePath);
      }
    } catch {
      throw new BadRequestException('Failed to delete file from storage');
    }

    await this.prisma.evidenceFile.update({
      where: { id: fileId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }
}
