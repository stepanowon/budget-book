import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserPayload } from '../types/domain';

export interface TokenPayload {
  id: string;
  username: string;
  status: string;
}

export function signAccessToken(payload: UserPayload): string {
  return jwt.sign(
    { id: payload.id, username: payload.username, status: payload.status },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL_SECONDS },
  );
}

export function signRefreshToken(payload: UserPayload): string {
  return jwt.sign(
    { id: payload.id, username: payload.username, status: payload.status },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL_SECONDS },
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
