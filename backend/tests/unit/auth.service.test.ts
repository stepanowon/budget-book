import { signup, login, logout, refreshTokens, withdraw } from '../../src/services/auth.service';
import * as userRepo from '../../src/repositories/user.repository';
import * as tokenRepo from '../../src/repositories/refreshToken.repository';
import * as crypto from '../../src/lib/crypto';
import { signRefreshToken } from '../../src/lib/jwt';
import { ConflictError, UnauthorizedError } from '../../src/middlewares/errorHandler.middleware';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/refreshToken.repository');

// withdraw에서 sql을 직접 사용하므로 모킹
jest.mock('../../src/lib/db', () => {
  const tag = jest.fn();
  return { sql: tag };
});

const { sql } = require('../../src/lib/db');

const mockUserRepo = userRepo as jest.Mocked<typeof userRepo>;
const mockTokenRepo = tokenRepo as jest.Mocked<typeof tokenRepo>;

const mockUser = {
  id: 'user-uuid-123',
  username: 'testuser',
  email: 'test@example.com',
  password_hash: '',
  status: 'active' as const,
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('auth.service — signup (BE-10)', () => {
  it('신규 사용자 가입 성공 (AC-U1)', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(null);
    mockUserRepo.findUserByEmail.mockResolvedValue(null);
    mockUserRepo.createUser.mockResolvedValue({ ...mockUser, status: 'active' });

    const result = await signup({ username: 'testuser', email: 'test@example.com', password: 'Password1!' });
    expect(result.status).toBe('active');
    expect(mockUserRepo.createUser).toHaveBeenCalledTimes(1);
  });

  it('중복 username이면 ConflictError 발생 (AC-U2)', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(mockUser);
    await expect(signup({ username: 'testuser', email: 'new@x.com', password: 'Password1!' }))
      .rejects.toBeInstanceOf(ConflictError);
  });

  it('중복 email이면 ConflictError 발생', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(null);
    mockUserRepo.findUserByEmail.mockResolvedValue(mockUser);
    await expect(signup({ username: 'newuser', email: 'test@example.com', password: 'Password1!' }))
      .rejects.toBeInstanceOf(ConflictError);
  });
});

describe('auth.service — login (BE-11)', () => {
  it('올바른 자격증명으로 로그인 성공', async () => {
    const hash = await crypto.hashPassword('Password1!');
    mockUserRepo.findUserByEmail.mockResolvedValue({ ...mockUser, password_hash: hash });
    mockTokenRepo.saveRefreshToken.mockResolvedValue();

    const result = await login({ email: 'test@example.com', password: 'Password1!' });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('존재하지 않는 사용자는 UnauthorizedError 발생', async () => {
    mockUserRepo.findUserByEmail.mockResolvedValue(null);
    await expect(login({ email: 'none@x.com', password: 'Password1!' }))
      .rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('inactive 사용자 로그인 시도는 UnauthorizedError 발생 (AC-U4)', async () => {
    mockUserRepo.findUserByEmail.mockResolvedValue({ ...mockUser, status: 'inactive' });
    await expect(login({ email: 'test@example.com', password: 'Password1!' }))
      .rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('잘못된 비밀번호는 UnauthorizedError 발생', async () => {
    const hash = await crypto.hashPassword('CorrectPassword1!');
    mockUserRepo.findUserByEmail.mockResolvedValue({ ...mockUser, password_hash: hash });
    await expect(login({ email: 'test@example.com', password: 'WrongPassword1!' }))
      .rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('auth.service — logout (BE-12)', () => {
  it('로그아웃 시 토큰 삭제 호출', async () => {
    mockTokenRepo.deleteRefreshToken.mockResolvedValue();
    await logout('some-token');
    expect(mockTokenRepo.deleteRefreshToken).toHaveBeenCalledWith('some-token');
  });
});

describe('auth.service — withdraw (BE-13)', () => {
  it('그룹 멤버십이 없는 사용자 탈퇴 성공', async () => {
    sql.mockResolvedValue([]);
    mockUserRepo.deactivateUser.mockResolvedValue(undefined);
    mockTokenRepo.deleteAllUserRefreshTokens.mockResolvedValue();

    await expect(withdraw('user-uuid-123')).resolves.toBeUndefined();
    expect(mockUserRepo.deactivateUser).toHaveBeenCalledWith('user-uuid-123');
    expect(mockTokenRepo.deleteAllUserRefreshTokens).toHaveBeenCalledWith('user-uuid-123');
  });

  it('그룹 멤버십이 있는 사용자 탈퇴 — MANAGER 이양 처리 후 비활성화', async () => {
    // 첫 sql 호출: SELECT group_id FROM group_members → 2개 반환
    // 이후 sql 호출: SELECT transfer_manager_or_deactivate_group(...) → []
    sql
      .mockResolvedValueOnce([{ group_id: 'grp-1' }, { group_id: 'grp-2' }])
      .mockResolvedValue([]);
    mockUserRepo.deactivateUser.mockResolvedValue(undefined);
    mockTokenRepo.deleteAllUserRefreshTokens.mockResolvedValue();

    await expect(withdraw('user-uuid-123')).resolves.toBeUndefined();
    // sql 호출: 1(memberships) + 2(transfer each) = 3
    expect(sql).toHaveBeenCalledTimes(3);
    expect(mockUserRepo.deactivateUser).toHaveBeenCalledWith('user-uuid-123');
  });
});

describe('auth.service — refreshTokens (BE-12)', () => {
  it('유효하지 않은 토큰(DB에 없음)은 UnauthorizedError', async () => {
    mockTokenRepo.findRefreshToken.mockResolvedValue(null);
    await expect(refreshTokens('invalid-token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('만료된 토큰은 UnauthorizedError', async () => {
    mockTokenRepo.findRefreshToken.mockResolvedValue({
      id: 'id',
      user_id: 'uid',
      token: 'tok',
      expires_at: new Date(Date.now() - 1000).toISOString(),
      created_at: new Date().toISOString(),
    });
    mockTokenRepo.deleteRefreshToken.mockResolvedValue();
    await expect(refreshTokens('expired-token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('DB에는 있지만 JWT 서명이 잘못된 토큰은 UnauthorizedError (라인 97-98)', async () => {
    mockTokenRepo.findRefreshToken.mockResolvedValue({
      id: 'id',
      user_id: 'uid',
      token: 'bad-jwt-token',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });
    mockTokenRepo.deleteRefreshToken.mockResolvedValue();

    await expect(refreshTokens('bad-jwt-token')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(mockTokenRepo.deleteRefreshToken).toHaveBeenCalledWith('bad-jwt-token');
  });

  it('DB에는 있지만 사용자가 inactive 상태이면 UnauthorizedError (라인 103-104)', async () => {
    const validRefresh = signRefreshToken({ id: mockUser.id, username: mockUser.username, status: 'active' });
    mockTokenRepo.findRefreshToken.mockResolvedValue({
      id: 'id',
      user_id: mockUser.id,
      token: validRefresh,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });
    mockUserRepo.findUserById.mockResolvedValue({ ...mockUser, status: 'inactive' });
    mockTokenRepo.deleteRefreshToken.mockResolvedValue();

    await expect(refreshTokens(validRefresh)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(mockTokenRepo.deleteRefreshToken).toHaveBeenCalledWith(validRefresh);
  });

  it('유효한 토큰으로 새 토큰 발급 성공', async () => {
    const validRefresh = signRefreshToken({ id: mockUser.id, username: mockUser.username, status: 'active' });
    mockTokenRepo.findRefreshToken.mockResolvedValue({
      id: 'id', user_id: mockUser.id, token: validRefresh,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });
    mockTokenRepo.deleteRefreshToken.mockResolvedValue();
    mockUserRepo.findUserById.mockResolvedValue(mockUser);
    mockTokenRepo.saveRefreshToken.mockResolvedValue();

    const result = await refreshTokens(validRefresh);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});
