import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from './errorHandler.middleware';
import { HTTP_STATUS, ERROR_CODES } from '../constants/errorCodes';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues;
      const details: Record<string, string[]> = {};
      issues.forEach((e) => {
        const field = e.path.join('.');
        if (!details[field]) details[field] = [];
        details[field].push(e.message);
      });

      // 422 vs 400 구분:
      // - custom 이슈(날짜 순서, 비즈니스 규칙) → 422
      // - 숫자형 too_small/too_big (금액 범위 등) → 422
      // - 문자열 형식/길이 오류 → 400
      const hasValidationError = issues.some(
        (e) =>
          e.code === 'custom' ||
          ((e.code === 'too_small' || e.code === 'too_big') &&
            (e as { type?: string }).type === 'number'),
      );

      const statusCode = hasValidationError
        ? HTTP_STATUS.UNPROCESSABLE_ENTITY
        : HTTP_STATUS.BAD_REQUEST;

      const errorCode = hasValidationError
        ? ERROR_CODES.VALIDATION_FAILED
        : ERROR_CODES.INVALID_INPUT;

      res.status(statusCode).json({
        success: false,
        errorCode,
        message: '입력값이 올바르지 않습니다.',
        details,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new BadRequestError('잘못된 쿼리 파라미터입니다.'));
    }
    req.query = result.data as Record<string, string>;
    next();
  };
}
