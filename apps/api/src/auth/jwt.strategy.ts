/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SystemRole } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    systemRole?: SystemRole;
    sessionVersion?: number;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        systemRole: true,
        isBlocked: true,
        blockedReason: true,
        sessionVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    if (user.isBlocked) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_BLOCKED',
        reason: user.blockedReason ?? null,
      });
    }

    if ((payload.sessionVersion ?? 0) !== user.sessionVersion) {
      throw new UnauthorizedException({
        code: 'SESSION_INVALIDATED',
      });
    }

    return {
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
      sessionVersion: user.sessionVersion,
    };
  }
}
