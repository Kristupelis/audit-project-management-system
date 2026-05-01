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

    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    const responseBody =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : {
            message:
              typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exception instanceof Error
                  ? exception.message
                  : 'Unhandled server exception',
          };

    const message =
      typeof responseBody.message === 'string'
        ? responseBody.message
        : exception instanceof Error
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
      ...responseBody,
      error:
        typeof responseBody.error === 'string'
          ? responseBody.error
          : isHttpException
            ? 'Request failed'
            : 'Internal Server Error',
    });
  }
}
