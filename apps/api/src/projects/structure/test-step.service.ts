import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType, AuditAction } from '@prisma/client';
import { testStepId, auditId } from '../../common/id';

@Injectable()
export class TestStepService {
  constructor(
    private prisma: PrismaService,
    private permissions: ProjectPermissionsService,
  ) {}

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

  async create(controlId: string, userId: string, description: string) {
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
    );

    const last = await this.prisma.testStep.findFirst({
      where: { controlId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const testStep = await tx.testStep.create({
        data: {
          id: testStepId(),
          controlId,
          description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          order: nextOrder,
        },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: control.process.auditArea.projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.TEST_STEP_CREATED,
          entity: 'TestStep',
          entityId: testStep.id,
          details: { description },
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
      ResourceType.TEST_STEP,
      PermissionAction.SEE,
    );

    return this.prisma.testStep.findMany({
      where: { controlId },
    });
  }

  async get(id: string, userId: string) {
    const projectId = await this.resolveProject(id);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.TEST_STEP,
      PermissionAction.READ,
    );

    return this.prisma.testStep.findUnique({ where: { id } });
  }

  async update(id: string, userId: string, description: string) {
    const projectId = await this.resolveProject(id);

    await this.permissions.requirePermission(
      projectId,
      userId,
      ResourceType.TEST_STEP,
      PermissionAction.UPDATE,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.testStep.update({
        where: { id: id },
        data: { description },
      });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.TEST_STEP_UPDATED,
          entity: 'TestStep',
          entityId: id,
          details: { description },
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
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.testStep.delete({ where: { id: id } });

      await tx.auditLog.create({
        data: {
          id: auditId(),
          projectId: projectId,
          actorId: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          action: AuditAction.TEST_STEP_DELETED,
          entity: 'TestStep',
          entityId: id,
        },
      });

      return { success: true };
    });
  }
}
