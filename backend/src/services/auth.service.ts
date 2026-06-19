import { hashPassword, comparePassword } from '../lib/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { sql } from '../lib/db';
import * as userRepo from '../repositories/user.repository';
import * as tokenRepo from '../repositories/refreshToken.repository';
import {
  ConflictError,
  UnauthorizedError,
} from '../middlewares/errorHandler.middleware';
import { env } from '../config/env';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function signup(params: {
  username: string;
  email: string;
  password: string;
}): Promise<{ id: string; username: string; status: string }> {
  // 중복 검사 (DR-01)
  const existingByUsername = await userRepo.findUserByUsername(params.username);
  if (existingByUsername) {
    throw new ConflictError('이미 사용 중인 아이디입니다.');
  }
  const existingByEmail = await userRepo.findUserByEmail(params.email);
  if (existingByEmail) {
    throw new ConflictError('이미 사용 중인 이메일입니다.');
  }

  const password_hash = await hashPassword(params.password);
  const user = await userRepo.createUser({
    username: params.username,
    email: params.email,
    password_hash,
  });

  console.info('[AUTH] User signed up', { userId: user.id });
  return { id: user.id, username: user.username, status: user.status };
}

export async function login(params: {
  email: string;
  password: string;
}): Promise<AuthTokens> {
  const user = await userRepo.findUserByEmail(params.email);

  if (!user) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  if (user.status === 'inactive') {
    throw new UnauthorizedError('탈퇴한 사용자입니다.'); // AC-U4
  }

  const isValid = await comparePassword(params.password, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const payload = { id: user.id, username: user.username, status: user.status };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(
    Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000,
  ).toISOString();

  await tokenRepo.saveRefreshToken({
    user_id: user.id,
    token: refreshToken,
    expires_at: expiresAt,
  });

  console.info('[AUTH] User logged in', { userId: user.id });
  return { accessToken, refreshToken };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  // DB에서 Refresh Token 검증
  const storedToken = await tokenRepo.findRefreshToken(refreshToken);
  if (!storedToken) {
    throw new UnauthorizedError('유효하지 않은 Refresh Token입니다.');
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    await tokenRepo.deleteRefreshToken(refreshToken);
    throw new UnauthorizedError('만료된 Refresh Token입니다.');
  }

  // JWT 서명 검증
  let payload: { id: string; username: string; status: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    await tokenRepo.deleteRefreshToken(refreshToken);
    throw new UnauthorizedError('유효하지 않은 Refresh Token입니다.');
  }

  const user = await userRepo.findUserById(payload.id);
  if (!user || user.status === 'inactive') {
    await tokenRepo.deleteRefreshToken(refreshToken);
    throw new UnauthorizedError('유효하지 않은 사용자입니다.');
  }

  // 기존 토큰 삭제 후 새 토큰 발급
  await tokenRepo.deleteRefreshToken(refreshToken);

  const newAccessToken = signAccessToken({ id: user.id, username: user.username, status: user.status });
  const newRefreshToken = signRefreshToken({ id: user.id, username: user.username, status: user.status });

  const expiresAt = new Date(
    Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000,
  ).toISOString();
  await tokenRepo.saveRefreshToken({ user_id: user.id, token: newRefreshToken, expires_at: expiresAt });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string): Promise<void> {
  await tokenRepo.deleteRefreshToken(refreshToken);
  console.info('[AUTH] User logged out');
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await userRepo.findUserById(userId);
  if (!user) throw new UnauthorizedError('사용자를 찾을 수 없습니다.');

  const isValid = await comparePassword(currentPassword, user.password_hash);
  if (!isValid) throw new UnauthorizedError('현재 비밀번호가 올바르지 않습니다.');

  const newHash = await hashPassword(newPassword);
  await userRepo.updatePasswordHash(userId, newHash);
  console.info('[AUTH] Password changed', { userId });
}

export async function withdraw(userId: string, refreshToken: string): Promise<void> {
  // 모든 소속 그룹에서 MANAGER 이양 처리 (DB 함수 호출)
  const memberships = await sql`SELECT group_id FROM group_members WHERE user_id = ${userId}`;

  for (const m of memberships) {
    const row = m as unknown as { group_id: string };
    await sql`SELECT transfer_manager_or_deactivate_group(${userId}::uuid, ${row.group_id}::uuid)`;
  }

  // 사용자 비활성화 (BR-12)
  await userRepo.deactivateUser(userId);

  // 모든 Refresh Token 삭제
  await tokenRepo.deleteAllUserRefreshTokens(userId);

  console.info('[AUTH] User withdrew', { userId });
}
