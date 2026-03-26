import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType } from '@prisma/client';
import { findingId } from '../../common/id';
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
    );

    return this.prisma.finding.create({
      data: {
        id: findingId(),
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
      ResourceType.FINDING,
      PermissionAction.READ,
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
    );

    return this.prisma.finding.update({
      where: { id: findingIdValue },
      data: dto,
    });
  }

  async delete(findingIdValue: string, userId: string) {
    const projectId = await this.resolveProject(findingIdValue);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.FINDING,
      PermissionAction.DELETE,
    );

    return this.prisma.finding.delete({
      where: { id: findingIdValue },
    });
  }
}
