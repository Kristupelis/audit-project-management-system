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
import { testStepId, auditId } from '../../common/id';
import { CreateTestStepDto, UpdateTestStepDto } from '../dto/test-step.dto';

@Injectable()
export class TestStepService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

  private mapDates(dto: Partial<CreateTestStepDto | UpdateTestStepDto>) {
    return {
      ...dto,
      performedAt: dto.performedAt ? new Date(dto.performedAt) : undefined,
      reviewedAt: dto.reviewedAt ? new Date(dto.reviewedAt) : undefined,
    };
  }

  async resolveProject(testStepIdValue: string) {
    const step = await this.prisma.testStep.findUnique({
      where: { id: testStepIdValue },
      include: {
        control: {
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

    if (!step) throw new NotFoundException('Test step not found');

    return step.control.process.auditArea.projectId;
  }

  async create(controlId: string, userId: string, dto: CreateTestStepDto) {
    const control = await this.prisma.control.findUnique({
      where: { id: controlId },
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

    if (!control) throw new NotFoundException('Control not found');

    await this.permissions.requirePermission(
      control.process.auditArea.projectId,
      userId,
      ResourceType.TEST_STEP,
      PermissionAction.CREATE,
      controlId,
    );

    const last = await this.prisma.testStep.findFirst({
      where: { controlId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (last?.order ?? -1) + 1;
    const mapped = this.mapDates(dto);

    return this.prisma.$transaction(async (tx) => {
      const testStep = await tx.testStep.create({
        data: {
          id: testStepId(),
          controlId,
          order: nextOrder,
          description: dto.description,
          stepNo: dto.stepNo,
          expectedResult: dto.expectedResult ?? null,
          actualResult: dto.actualResult ?? null,
          testMethod: dto.testMethod,
          status: dto.status,
          sampleReference: dto.sampleReference ?? null,
          performedBy: dto.performedBy ?? null,
          performedAt:
            'performedAt' in mapped
              ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                (mapped.performedAt as Date | undefined)
              : undefined,
          reviewedBy: dto.reviewedBy ?? null,
          reviewedAt:
            'reviewedAt' in mapped
              ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                (mapped.reviewedAt as Date | undefined)
              : undefined,
          notes: dto.notes ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: control.process.auditArea.projectId,
          actorId: userId,
          action: AuditAction.TEST_STEP_CREATED,
          entity: 'TestStep',
          entityId: testStep.id,
          details: dto as unknown as Prisma.InputJsonValue,
        },
      });

      return testStep;
    });
  }

  async listByControl(controlId: string, userId: string) {
    const control = await this.prisma.control.findUnique({
      where: { id: controlId },
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

    if (!control) throw new NotFoundException('Control not found');

    await this.permissions.requirePermission(
      control.process.auditArea.projectId,
      userId,
      ResourceType.CONTROL,
      PermissionAction.SEE,
      controlId,
    );

    return this.prisma.testStep.findMany({
      where: { controlId },
      orderBy: { order: 'asc' },
    });
  }

  async get(id: string, userId: string) {
    const projectId = await this.resolveProject(id);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.TEST_STEP,
      PermissionAction.READ,
      id,
    );

    return this.prisma.testStep.findUnique({ where: { id } });
  }

  async update(id: string, userId: string, dto: UpdateTestStepDto) {
    const projectId = await this.resolveProject(id);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.TEST_STEP,
      PermissionAction.UPDATE,
      id,
    );

    const mapped = this.mapDates(dto);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.testStep.update({
        where: { id },
        data: mapped,
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.TEST_STEP_UPDATED,
          entity: 'TestStep',
          entityId: id,
          details: dto as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async delete(id: string, userId: string) {
    const projectId = await this.resolveProject(id);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.TEST_STEP,
      PermissionAction.DELETE,
      id,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.testStep.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId,
          actorId: userId,
          action: AuditAction.TEST_STEP_DELETED,
          entity: 'TestStep',
          entityId: id,
        },
      });

      return { success: true };
    });
  }
}
