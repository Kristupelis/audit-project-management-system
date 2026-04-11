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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
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
        systemRole: true,
        isTwoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
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
      },
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
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
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

    const token = await this.issueAccessToken(
      user.id,
      user.email,
      user.systemRole,
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole,
      },
      ...token,
    };
  }

  async verifyTwoFactorLogin(userIdValue: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userIdValue },
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Invalid user');
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
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole,
      },
      ...token,
    };
  }

  private async issueAccessToken(
    userIdValue: string,
    email: string,
    systemRole: SystemRole,
  ) {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET missing');

    const accessExpRaw =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '1h';
    const accessExp = this.asExpiresIn(accessExpRaw);

    const payload = { sub: userIdValue, email, systemRole };

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
