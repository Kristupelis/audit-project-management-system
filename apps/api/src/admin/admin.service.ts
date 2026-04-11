import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireSuperAdmin(actorId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, systemRole: true },
    });

    if (!actor || actor.systemRole !== SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN required');
    }
  }

  private async getBlockingProjects(targetUserId: string) {
    const ownedProjects = await this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: targetUserId,
            isOwner: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        members: {
          where: { isOwner: true },
          select: { userId: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return ownedProjects
      .filter((project) => {
        const ownerIds = project.members.map((m) => m.userId);
        return ownerIds.length === 1 && ownerIds[0] === targetUserId;
      })
      .map((project) => ({
        id: project.id,
        name: project.name,
      }));
  }

  async listUsers(actorId: string) {
    await this.requireSuperAdmin(actorId);

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
        createdAt: true,
        _count: {
          select: {
            projectMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      currentUserId: actorId,
      users,
    };
  }

  async blockUser(actorId: string, targetUserId: string, reason?: string) {
    await this.requireSuperAdmin(actorId);

    if (actorId === targetUserId) {
      throw new ForbiddenException('You cannot block yourself');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const blockingProjects = await this.getBlockingProjects(targetUserId);

    if (blockingProjects.length > 0) {
      const projectNames = blockingProjects.map((p) => p.name).join(', ');
      throw new ForbiddenException(
        `Cannot block this user because they are the last owner of project(s): ${projectNames}. Transfer ownership first.`,
      );
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason?.trim() || 'Blocked by administrator',
      },
      select: {
        id: true,
        email: true,
        name: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
      },
    });
  }

  async unblockUser(actorId: string, targetUserId: string) {
    await this.requireSuperAdmin(actorId);

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
      },
    });
  }

  async deleteUser(actorId: string, targetUserId: string) {
    await this.requireSuperAdmin(actorId);

    if (actorId === targetUserId) {
      throw new ForbiddenException('You cannot delete yourself');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const blockingProjects = await this.getBlockingProjects(targetUserId);

    if (blockingProjects.length > 0) {
      const projectNames = blockingProjects.map((p) => p.name).join(', ');
      throw new ForbiddenException(
        `Cannot delete this user because they are the last owner of project(s): ${projectNames}. Transfer ownership first.`,
      );
    }

    await this.prisma.user.delete({
      where: { id: targetUserId },
    });

    return { success: true };
  }
}
