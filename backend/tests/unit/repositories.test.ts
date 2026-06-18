/**
 * repositories 단위 테스트 (BE-28 커버리지 보완)
 * postgres.js sql 태그 함수를 모킹하여 저장소 함수들을 테스트
 */

// sql mock — 가장 먼저 선언
const mockSql = jest.fn();

jest.mock('../../src/lib/db', () => ({
  sql: mockSql,
}));

import * as userRepo from '../../src/repositories/user.repository';
import * as tokenRepo from '../../src/repositories/refreshToken.repository';

beforeEach(() => {
  jest.clearAllMocks();
});

// -----------------------------------------------------------------------
// user.repository
// -----------------------------------------------------------------------
describe('user.repository — findUserByEmail', () => {
  it('사용자가 있으면 User 객체를 반환한다', async () => {
    const mockUser = {
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      password_hash: 'hash',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
    };
    mockSql.mockResolvedValue([mockUser]);

    const result = await userRepo.findUserByEmail('alice@example.com');

    expect(result).toEqual(mockUser);
  });

  it('사용자가 없으면 null을 반환한다', async () => {
    mockSql.mockResolvedValue([]);

    const result = await userRepo.findUserByEmail('nobody@example.com');

    expect(result).toBeNull();
  });
});

describe('user.repository — findUserByUsername', () => {
  it('사용자가 있으면 User 객체를 반환한다', async () => {
    const mockUser = {
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      password_hash: 'hash',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
    };
    mockSql.mockResolvedValue([mockUser]);

    const result = await userRepo.findUserByUsername('alice');

    expect(result).toEqual(mockUser);
  });

  it('사용자가 없으면 null을 반환한다', async () => {
    mockSql.mockResolvedValue([]);

    const result = await userRepo.findUserByUsername('nobody');

    expect(result).toBeNull();
  });
});

describe('user.repository — findUserById', () => {
  it('사용자가 있으면 User 객체를 반환한다', async () => {
    const mockUser = {
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      password_hash: 'hash',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
    };
    mockSql.mockResolvedValue([mockUser]);

    const result = await userRepo.findUserById('u1');

    expect(result).toEqual(mockUser);
  });

  it('사용자가 없으면 null을 반환한다', async () => {
    mockSql.mockResolvedValue([]);

    const result = await userRepo.findUserById('nonexistent');

    expect(result).toBeNull();
  });
});

describe('user.repository — createUser', () => {
  it('사용자를 생성하고 반환한다', async () => {
    const mockUser = {
      id: 'new-uuid',
      username: 'bob',
      email: 'bob@example.com',
      password_hash: 'hashed',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
    };
    mockSql.mockResolvedValue([mockUser]);

    const result = await userRepo.createUser({
      username: 'bob',
      email: 'bob@example.com',
      password_hash: 'hashed',
    });

    expect(result).toEqual(mockUser);
  });
});

describe('user.repository — deactivateUser', () => {
  it('사용자를 비활성화한다', async () => {
    mockSql.mockResolvedValue([]);

    await expect(userRepo.deactivateUser('u1')).resolves.toBeUndefined();
  });
});

// -----------------------------------------------------------------------
// refreshToken.repository
// -----------------------------------------------------------------------
describe('refreshToken.repository — saveRefreshToken', () => {
  it('Refresh Token을 저장한다', async () => {
    mockSql.mockResolvedValue([]);

    await expect(
      tokenRepo.saveRefreshToken({
        user_id: 'u1',
        token: 'refresh-token-value',
        expires_at: '2025-12-31T00:00:00Z',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('refreshToken.repository — findRefreshToken', () => {
  it('토큰이 있으면 RefreshToken 객체를 반환한다', async () => {
    const mockToken = {
      id: 'tok-1',
      user_id: 'u1',
      token: 'some-token',
      expires_at: '2025-12-31T00:00:00Z',
      created_at: '2025-01-01T00:00:00Z',
    };
    mockSql.mockResolvedValue([mockToken]);

    const result = await tokenRepo.findRefreshToken('some-token');

    expect(result).toEqual(mockToken);
  });

  it('토큰이 없으면 null을 반환한다', async () => {
    mockSql.mockResolvedValue([]);

    const result = await tokenRepo.findRefreshToken('nonexistent');

    expect(result).toBeNull();
  });
});

describe('refreshToken.repository — deleteRefreshToken', () => {
  it('Refresh Token을 삭제한다', async () => {
    mockSql.mockResolvedValue([]);

    await expect(tokenRepo.deleteRefreshToken('some-token')).resolves.toBeUndefined();
  });
});

describe('refreshToken.repository — deleteAllUserRefreshTokens', () => {
  it('사용자의 모든 Refresh Token을 삭제한다', async () => {
    mockSql.mockResolvedValue([]);

    await expect(tokenRepo.deleteAllUserRefreshTokens('u1')).resolves.toBeUndefined();
  });
});
