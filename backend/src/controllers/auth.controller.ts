import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { HTTP_STATUS } from '../constants/errorCodes';
import { BadRequestError } from '../middlewares/errorHandler.middleware';
import { env } from '../config/env';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: env.JWT_REFRESH_TTL_SECONDS * 1000,
};

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.signup(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accessToken, refreshToken } = await authService.login(req.body);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      return next(new BadRequestError('Refresh Token이 없습니다.'));
    }
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(refreshToken);
    res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, COOKIE_OPTIONS);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: '로그아웃되었습니다.' } });
  } catch (err) {
    next(err);
  }
}

export async function withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE] ?? '';
    await authService.withdraw(userId, refreshToken);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: '탈퇴가 완료되었습니다.' } });
  } catch (err) {
    next(err);
  }
}
