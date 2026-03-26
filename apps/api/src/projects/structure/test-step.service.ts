import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectPermissionsService } from '../permissions.service';
import { PermissionAction, ResourceType } from '@prisma/client';
import { testStepId } from '../../common/id';

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

    return this.prisma.testStep.create({
      data: {
        id: testStepId(),
        controlId,
        description,
      },
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
      PermissionAction.READ,
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

    return this.prisma.testStep.update({
      where: { id },
      data: { description },
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

    return this.prisma.testStep.delete({ where: { id } });
  }
}
