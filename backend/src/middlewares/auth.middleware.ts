import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthorizedError } from './errorHandler.middleware';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('인증 토큰이 없습니다.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    if (payload.status === 'inactive') {
      return next(new UnauthorizedError('비활성화된 사용자입니다.'));
    }

    req.user = {
      id: payload.id,
      username: payload.username,
      status: payload.status as 'active' | 'inactive',
    };

    next();
  } catch {
    next(new UnauthorizedError('유효하지 않거나 만료된 토큰입니다.'));
  }
}
