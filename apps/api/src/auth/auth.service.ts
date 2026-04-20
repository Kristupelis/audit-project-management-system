/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { userId } from '../common/id';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SystemRole } from '@prisma/client';
import { SystemLogsService } from '../admin/system-logs.service';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 6;
  private readonly FAILED_WINDOW_MS = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly systemLogs: SystemLogsService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        id: userId(),
        email: normalizedEmail,
        name: name?.trim() || null,
        passwordHash,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    await this.systemLogs.write({
      level: 'INFO',
      action: 'REGISTER_SUCCESS',
      message: `New user registered: ${user.email}`,
      actorUserId: user.id,
      details: {
        email: user.email,
        name: user.name,
      },
    });

    return {
      requiresTwoFactorSetup: true,
      userId: user.id,
      email: user.email,
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        isTwoFactorEnabled: true,
        systemRole: true,
        isBlocked: true,
        blockedReason: true,
        failedLoginAttempts: true,
        firstFailedLoginAt: true,
        sessionVersion: true,
      },
    });

    if (!user || !user.passwordHash) {
      await this.systemLogs.write({
        level: 'SECURITY',
        action: 'LOGIN_FAILED',
        message: `Login failed for email ${normalizedEmail}`,
        details: {
          email: normalizedEmail,
          reason: 'invalid_credentials',
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      await this.systemLogs.write({
        level: 'SECURITY',
        action: 'LOGIN_BLOCKED',
        message: `Blocked user attempted to log in: ${normalizedEmail}`,
        actorUserId: user.id,
        details: {
          reason: user.blockedReason ?? null,
        },
      });

      throw new UnauthorizedException({
        code: 'ACCOUNT_BLOCKED',
        reason: user.blockedReason ?? null,
      });
    }

    const ok = await argon2.verify(user.passwordHash, password);

    if (!ok) {
      const updatedUser = await this.registerFailedLoginAttempt(user.id);

      if (updatedUser.isBlocked) {
        await this.systemLogs.write({
          level: 'SECURITY',
          action: 'ACCOUNT_AUTO_BLOCKED',
          message: `User ${normalizedEmail} was automatically blocked after repeated failed login attempts`,
          actorUserId: user.id,
          details: {
            reason: updatedUser.blockedReason ?? null,
            email: normalizedEmail,
          },
        });

        throw new UnauthorizedException({
          code: 'ACCOUNT_BLOCKED',
          reason: updatedUser.blockedReason ?? null,
        });
      }
      await this.systemLogs.write({
        level: 'SECURITY',
        action: 'LOGIN_FAILED',
        message: `Login failed for email ${normalizedEmail}`,
        details: {
          email: normalizedEmail,
          reason: 'invalid_credentials',
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.resetFailedLoginAttempts(user.id);

    await this.systemLogs.write({
      level: 'INFO',
      action: 'LOGIN_SUCCESS',
      message: `Successful login for ${normalizedEmail}`,
      actorUserId: user.id,
    });

    if (user.isTwoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        userId: user.id,
        email: user.email,
      };
    }

    return {
      requiresTwoFactorSetup: true,
      userId: user.id,
      email: user.email,
    };
  }

  async getMe(userIdValue: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userIdValue },
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true,
        isTwoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        isBlocked: true,
        blockedReason: true,
        sessionVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_BLOCKED',
        reason: user.blockedReason ?? null,
      });
    }

    return user;
  }

  async updateProfile(userIdValue: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userIdValue },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const nextEmail =
      dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
    const nextName = dto.name !== undefined ? dto.name.trim() : undefined;

    if (nextEmail && nextEmail !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });

      if (existing && existing.id !== userIdValue) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userIdValue },
      data: {
        ...(dto.email !== undefined ? { email: nextEmail } : {}),
        ...(dto.name !== undefined ? { name: nextName || null } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isTwoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        systemRole: true,
        isBlocked: true,
        blockedReason: true,
        sessionVersion: true,
      },
    });

    await this.systemLogs.write({
      level: 'INFO',
      action: 'ACCOUNT_PROFILE_UPDATED',
      message: `User ${updated.email} updated account profile`,
      actorUserId: updated.id,
      details: {
        previousEmail: user.email,
        newEmail: updated.email,
        previousName: user.name,
        newName: updated.name,
      },
    });

    return updated;
  }

  async changePassword(userIdValue: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userIdValue },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    const validCurrentPassword = await argon2.verify(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!validCurrentPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userIdValue },
      data: {
        passwordHash: newPasswordHash,
        sessionVersion: { increment: 1 },
      },
    });

    await this.systemLogs.write({
      level: 'SECURITY',
      action: 'ACCOUNT_PASSWORD_CHANGED',
      message: `User password changed successfully`,
      actorUserId: userIdValue,
    });

    return { success: true };
  }

  async generateTwoFactorSetup(userIdValue: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userIdValue },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `APMS (${user.email})`,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url ?? '');

    return {
      base32: secret.base32,
      qrCode,
    };
  }

  async enableTwoFactor(userIdValue: string, secret: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userIdValue },
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true,
        isBlocked: true,
        blockedReason: true,
        sessionVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_BLOCKED',
        reason: user.blockedReason ?? null,
      });
    }

    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: normalizedCode,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userIdValue },
      data: {
        twoFactorSecret: secret,
        isTwoFactorEnabled: true,
      },
    });

    await this.systemLogs.write({
      level: 'SECURITY',
      action: 'TWO_FACTOR_ENABLED',
      message: `2FA enabled successfully for ${user.email}`,
      actorUserId: user.id,
    });

    const token = await this.issueAccessToken(
      user.id,
      user.email,
      user.systemRole,
      user.sessionVersion,
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole,
        sessionVersion: user.sessionVersion,
      },
      ...token,
    };
  }

  async verifyTwoFactorLogin(userIdValue: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userIdValue },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorSecret: true,
        systemRole: true,
        isBlocked: true,
        blockedReason: true,
        sessionVersion: true,
      },
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Invalid user');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_BLOCKED',
        reason: user.blockedReason ?? null,
      });
    }

    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: normalizedCode,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const token = await this.issueAccessToken(
      user.id,
      user.email,
      user.systemRole,
      user.sessionVersion,
    );

    await this.systemLogs.write({
      level: 'SECURITY',
      action: 'TWO_FACTOR_LOGIN_SUCCESS',
      message: `2FA verification successful for ${user.email}`,
      actorUserId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole,
        sessionVersion: user.sessionVersion,
      },
      ...token,
    };
  }

  private async registerFailedLoginAttempt(userIdValue: string) {
    const now = new Date();

    const current = await this.prisma.user.findUnique({
      where: { id: userIdValue },
      select: {
        id: true,
        failedLoginAttempts: true,
        firstFailedLoginAt: true,
      },
    });

    if (!current) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isWindowExpired =
      !current.firstFailedLoginAt ||
      now.getTime() - current.firstFailedLoginAt.getTime() >
        this.FAILED_WINDOW_MS;

    const nextAttempts = isWindowExpired ? 1 : current.failedLoginAttempts + 1;

    const firstFailedLoginAt = isWindowExpired
      ? now
      : current.firstFailedLoginAt;

    const shouldBlock = nextAttempts >= this.MAX_FAILED_ATTEMPTS;

    return this.prisma.user.update({
      where: { id: userIdValue },
      data: {
        failedLoginAttempts: shouldBlock ? 0 : nextAttempts,
        firstFailedLoginAt: shouldBlock ? null : firstFailedLoginAt,
        ...(shouldBlock
          ? {
              isBlocked: true,
              blockedAt: now,
              blockedReason:
                'Automatically blocked after 6 failed login attempts within 5 minutes',
              sessionVersion: { increment: 1 },
            }
          : {}),
      },
      select: {
        id: true,
        isBlocked: true,
        blockedReason: true,
      },
    });
  }

  private async resetFailedLoginAttempts(userIdValue: string) {
    await this.prisma.user.update({
      where: { id: userIdValue },
      data: {
        failedLoginAttempts: 0,
        firstFailedLoginAt: null,
      },
    });
  }

  private async issueAccessToken(
    userIdValue: string,
    email: string,
    systemRole: SystemRole,
    sessionVersion: number,
  ) {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET missing');

    const accessExpRaw =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '1h';
    const accessExp = this.asExpiresIn(accessExpRaw);

    const payload = { sub: userIdValue, email, systemRole, sessionVersion };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExp,
    });

    const accessExpiresAt = this.computeExpiryDate(accessExpRaw).getTime();

    return { accessToken, accessExpiresAt };
  }

  private asExpiresIn(value: string): SignOptions['expiresIn'] {
    const trimmed = value.trim();
    const n = Number(trimmed);

    if (!Number.isNaN(n) && trimmed !== '') return n;
    return trimmed;
  }

  private computeExpiryDate(exp: string) {
    const m = /^(\d+)([smhd])$/.exec(exp.trim());
    if (!m) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const value = Number(m[1]);
    const unit = m[2];

    const ms =
      unit === 's'
        ? value * 1000
        : unit === 'm'
          ? value * 60 * 1000
          : unit === 'h'
            ? value * 60 * 60 * 1000
            : value * 24 * 60 * 60 * 1000;

    return new Date(Date.now() + ms);
  }
}
