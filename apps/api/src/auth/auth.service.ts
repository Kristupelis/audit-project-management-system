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
//import * as speakeasyRaw from 'speakeasy';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { userId } from '../common/id';

/*
const speakeasy = speakeasyRaw as unknown as {
  generateSecret: (opts: { length: number; name: string }) => {
    base32: string;
    otpauth_url?: string;
  };
  totp: (opts: {
    secret: string;
    encoding: 'base32';
    token: string;
  }) => boolean;
};
*/

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: { id: userId(), email, name: name ?? null, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return {
      requiresTwoFactorSetup: true,
      userId: user.id,
      email: user.email,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
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

  async generateTwoFactorSetup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

  async enableTwoFactor(userId: string, secret: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        isTwoFactorEnabled: true,
      },
    });

    const token = await this.issueAccessToken(user.id, user.email);

    return {
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      ...token,
    };
  }

  async verifyTwoFactorLogin(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    const token = await this.issueAccessToken(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...token,
    };
  }

  private async issueAccessToken(userId: string, email: string) {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET missing');

    const accessExpRaw =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '1h';
    const accessExp = this.asExpiresIn(accessExpRaw);

    const payload = { sub: userId, email };

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
