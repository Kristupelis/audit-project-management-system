import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestUser = { userId: string; email: string };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestUser => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const req = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return req.user as RequestUser;
  },
);
