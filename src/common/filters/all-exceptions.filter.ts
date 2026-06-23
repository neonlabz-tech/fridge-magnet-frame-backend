import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;

    const maybeMulterError = exception as any;
    if (maybeMulterError?.code === 'LIMIT_UNEXPECTED_FILE' && maybeMulterError?.field === 'galleryImages') {
      // Raw Multer error (caught before NestJS transforms it)
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'You can upload a maximum of 5 gallery images.';
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        // Handle class-validator array of messages
        if (Array.isArray(res.message)) {
          message = (res.message as string[]).join(', ');
        } else {
          message = (res.message as string) || exception.message;
        }
      } else {
        message = exception.message;
      }

      // NestJS transforms MulterError(LIMIT_UNEXPECTED_FILE, 'galleryImages')
      // into BadRequestException('Unexpected field - galleryImages') before this
      // filter sees it — intercept that specific message here.
      if (statusCode === HttpStatus.BAD_REQUEST && message.includes('galleryImages')) {
        message = 'You can upload a maximum of 5 gallery images.';
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error: true,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
