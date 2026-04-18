import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

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

  private async ensureTargetExists(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
        systemRole: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

  async updateUser(
    actorId: string,
    targetUserId: string,
    dto: UpdateProfileDto,
  ) {
    await this.requireSuperAdmin(actorId);

    if (actorId === targetUserId) {
      throw new ForbiddenException(
        'Use your account page to update your own profile',
      );
    }

    const existingUser = await this.ensureTargetExists(targetUserId);

    const nextEmail =
      dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
    const nextName = dto.name !== undefined ? dto.name.trim() : undefined;

    if (nextEmail && nextEmail !== existingUser.email) {
      const emailOwner = await this.prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });

      if (emailOwner && emailOwner.id !== targetUserId) {
        throw new BadRequestException('Email already in use');
      }
    }

    const isEmailChanged =
      nextEmail !== undefined && nextEmail !== existingUser.email;

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(dto.email !== undefined ? { email: nextEmail } : {}),
        ...(dto.name !== undefined ? { name: nextName || null } : {}),
        ...(isEmailChanged ? { sessionVersion: { increment: 1 } } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
        createdAt: true,
      },
    });
  }

  async resetUserPassword(
    actorId: string,
    targetUserId: string,
    newPassword: string,
  ) {
    await this.requireSuperAdmin(actorId);

    if (actorId === targetUserId) {
      throw new ForbiddenException(
        'Use your account page to change your own password',
      );
    }

    await this.ensureTargetExists(targetUserId);

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        firstFailedLoginAt: null,
        sessionVersion: { increment: 1 },
      },
    });

    return { success: true };
  }

  async blockUser(actorId: string, targetUserId: string, reason?: string) {
    await this.requireSuperAdmin(actorId);

    if (actorId === targetUserId) {
      throw new ForbiddenException('You cannot block yourself');
    }

    await this.ensureTargetExists(targetUserId);

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
        sessionVersion: { increment: 1 },
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

    await this.ensureTargetExists(targetUserId);

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        failedLoginAttempts: 0,
        firstFailedLoginAt: null,
        sessionVersion: { increment: 1 },
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

    await this.ensureTargetExists(targetUserId);

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
