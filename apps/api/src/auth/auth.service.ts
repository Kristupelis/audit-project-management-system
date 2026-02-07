/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';


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
      data: { email, name: name ?? null, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // 2FA will be checked here later (user.is2faEnabled + otp validation)

    const tokens = await this.issueTokens(user.id, user.email);

    // Refresh token rotation: delete old tokens (simple v1)
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const safeUser = { id: user.id, email: user.email, name: user.name };
    return { user: safeUser, ...tokens };
  }

  async refresh(userId: string, refreshToken: string) {
    // verify refresh token exists (hashed)
    const tokenHash = this.hashToken(refreshToken);

    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!row || row.userId !== userId)
      throw new UnauthorizedException('Invalid refresh token');
    if (row.expiresAt.getTime() < Date.now()) {
      await this.prisma.refreshToken.delete({ where: { tokenHash } });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const tokens = await this.issueTokens(user.id, user.email);

    // rotate: delete old, store new
    await this.prisma.refreshToken.delete({ where: { tokenHash } });
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  

  private async issueTokens(userId: string, email: string) {
    const accessSecret = this.config.get<string>("JWT_ACCESS_SECRET");
    const refreshSecret = this.config.get<string>("JWT_REFRESH_SECRET");
    if (!accessSecret || !refreshSecret) throw new Error("JWT secrets missing");

    const accessExpRaw = this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m";
    const refreshExpRaw = this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "30d";

    const accessExp = this.asExpiresIn(accessExpRaw);
    const refreshExp = this.asExpiresIn(refreshExpRaw);

    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
        this.jwt.signAsync(payload, { secret: accessSecret, expiresIn: accessExp }),
        this.jwt.signAsync(payload, { secret: refreshSecret, expiresIn: refreshExp }),
    ]);

    const refreshExpiresAt = this.computeExpiryDate(refreshExpRaw);
    return { accessToken, refreshToken, refreshExpiresAt };
    }

    private asExpiresIn(value: string): SignOptions["expiresIn"] {
    const trimmed = value.trim();
    const n = Number(trimmed);
    if (!Number.isNaN(n) && trimmed !== "") return n; // seconds
    return trimmed; // e.g. "15m", "30d"
    }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const refreshExp =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
    const expiresAt = this.computeExpiryDate(refreshExp);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  private hashToken(token: string) {
    // add a random salt prefix to reduce length-extension style issues (simple)
    const salt = this.config.get<string>('JWT_REFRESH_SECRET') ?? 'salt';
    return createHash('sha256')
      .update(token + salt)
      .digest('hex');
  }

  private computeExpiryDate(exp: string) {
    // supports "15m", "30d", "1h" style (simple parser)
    const m = /^(\d+)([smhd])$/.exec(exp.trim());
    if (!m) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const value = Number(m[1]);
    const unit = m[2];
    const ms =
      unit === "s" ? value * 1000 :
      unit === "m" ? value * 60 * 1000 :
      unit === "h" ? value * 60 * 60 * 1000 :
      value * 24 * 60 * 60 * 1000;

    return new Date(Date.now() + ms);
  }
}
