import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES, HTTP_STATUS } from '../constants/errorCodes';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다.') {
    super(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHENTICATED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다.') {
    super(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다.') {
    super(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_RESOURCE, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_FAILED, message, details);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      errorCode: err.errorCode,
      message: err.message,
      details: err.details ?? {},
    });
    return;
  }

  console.error('[ERROR]', { path: req.path, method: req.method, error: err.message });
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    errorCode: ERROR_CODES.INTERNAL_ERROR,
    message: '서버 내부 오류가 발생했습니다.',
    details: {},
  });
}
