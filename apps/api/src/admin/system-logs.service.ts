import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SystemLogLevel, SystemRole } from '@prisma/client';
import { systemLogId } from '../common/id';

type WriteSystemLogInput = {
  level: SystemLogLevel;
  action: string;
  message: string;
  details?: Prisma.InputJsonValue;
  actorUserId?: string | null;
  targetUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class SystemLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async write(input: WriteSystemLogInput) {
    return this.prisma.systemLog.create({
      data: {
        id: systemLogId(),
        level: input.level,
        action: input.action,
        message: input.message,
        details: input.details,
        actorUserId: input.actorUserId ?? null,
        targetUserId: input.targetUserId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async list(
    actorId: string,
    query?: {
      page?: string;
      pageSize?: string;
      level?: string;
      action?: string;
    },
  ) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { systemRole: true },
    });

    if (!actor || actor.systemRole !== SystemRole.SUPER_ADMIN) {
      throw new Error('SUPER_ADMIN required');
    }

    const page = Math.max(Number(query?.page ?? 1), 1);
    const pageSize = Math.max(Number(query?.pageSize ?? 30), 1);

    const where: Prisma.SystemLogWhereInput = {
      ...(query?.level ? { level: query.level as SystemLogLevel } : {}),
      ...(query?.action
        ? {
            action: {
              contains: query.action,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actorUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          targetUser: {
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
