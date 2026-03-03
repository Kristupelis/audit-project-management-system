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

    const token = await this.issueAccessToken(user.id, user.email);
    return { user, ...token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // 2FA will be checked here later

    const token = await this.issueAccessToken(user.id, user.email);

    const safeUser = { id: user.id, email: user.email, name: user.name };
    return { user: safeUser, ...token };
  }


  private async issueAccessToken(userId: string, email: string) {
    const accessSecret = this.config.get<string>("JWT_ACCESS_SECRET");
    if (!accessSecret) throw new Error("JWT_ACCESS_SECRET missing");

    const accessExpRaw = this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "1h";
    const accessExp = this.asExpiresIn(accessExpRaw);

    const payload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExp,
    });

    const accessExpiresAt = this.computeExpiryDate(accessExpRaw).getTime();
    return { accessToken, accessExpiresAt };
  }

    private asExpiresIn(value: string): SignOptions["expiresIn"] {
    const trimmed = value.trim();
    const n = Number(trimmed);
    if (!Number.isNaN(n) && trimmed !== "") return n; // seconds
    return trimmed; // e.g. "15m", "30d"
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
