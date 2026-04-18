import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SystemRole } from '@prisma/client';

export type RequestUser = {
  sub: string;
  email: string;
  systemRole?: SystemRole;
  sessionVersion?: number;
};

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const req = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = req.user as RequestUser;

    return data ? user?.[data] : user;
  },
);
