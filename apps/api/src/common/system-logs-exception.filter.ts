import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SystemLogsService } from '../admin/system-logs.service';

@Catch()
export class SystemLogsExceptionFilter implements ExceptionFilter {
  constructor(private readonly systemLogs: SystemLogsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: { sub?: string } }>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error
        ? exception.message
        : 'Unhandled server exception';

    void this.systemLogs.write({
      level: status >= 500 ? 'ERROR' : 'WARNING',
      action: 'HTTP_EXCEPTION',
      message,
      actorUserId: request.user?.sub ?? null,
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
      details: {
        method: request.method,
        path: request.url,
        status,
      },
    });

    response.status(status).json({
      statusCode: status,
      message,
      error: isHttpException ? 'Request failed' : 'Internal Server Error',
    });
  }
}
