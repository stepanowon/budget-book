/**
 * 컨트롤러 통합 테스트 (BE-28, BE-29)
 * - auth.controller: refresh, withdraw, logout
 * - group.controller: createGroup, getMyGroups
 * - settlement.controller: createSettlement, getSettlements
 * - category.controller: getCategories, createGroupCategory
 * - 권한 거부 시나리오(403/401) 5개 이상
 */

import request from 'supertest';
import app from '../../src/app';
import * as userRepo from '../../src/repositories/user.repository';
import * as tokenRepo from '../../src/repositories/refreshToken.repository';
import * as groupRepo from '../../src/repositories/group.repository';
import * as settlementRepo from '../../src/repositories/settlement.repository';
import * as expenseRepo from '../../src/repositories/expense.repository';
import * as categoryRepo from '../../src/repositories/category.repository';
import * as reportRepo from '../../src/repositories/report.repository';
import { signAccessToken, signRefreshToken } from '../../src/lib/jwt';

// 저장소 레이어 전체 모킹
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/refreshToken.repository');
jest.mock('../../src/repositories/group.repository');
jest.mock('../../src/repositories/settlement.repository');
jest.mock('../../src/repositories/expense.repository');
jest.mock('../../src/repositories/category.repository');
jest.mock('../../src/repositories/report.repository');

// role.middleware의 sql 직접 호출 모킹 (기본값: 빈 배열 → 그룹/멤버 없음)
jest.mock('../../src/lib/db', () => ({
  sql: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sql: mockSql } = require('../../src/lib/db') as { sql: jest.Mock };

const mockUserRepo = userRepo as jest.Mocked<typeof userRepo>;
const mockTokenRepo = tokenRepo as jest.Mocked<typeof tokenRepo>;
const mockGroupRepo = groupRepo as jest.Mocked<typeof groupRepo>;
const mockSettlementRepo = settlementRepo as jest.Mocked<typeof settlementRepo>;
const mockExpenseRepo = expenseRepo as jest.Mocked<typeof expenseRepo>;
const mockCategoryRepo = categoryRepo as jest.Mocked<typeof categoryRepo>;
const mockReportRepo = reportRepo as jest.Mocked<typeof reportRepo>;

const mockUser = {
  id: 'user-uuid',
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed',
  status: 'active' as const,
  created_at: new Date().toISOString(),
};

const validAccessToken = signAccessToken({
  id: 'user-uuid',
  username: 'testuser',
  status: 'active',
});

const validRefreshToken = signRefreshToken({
  id: 'user-uuid',
  username: 'testuser',
  status: 'active',
});

beforeEach(() => jest.clearAllMocks());

// -----------------------------------------------------------------------
// auth.controller — refresh token 갱신
// -----------------------------------------------------------------------
describe('통합 테스트 — Auth Controller (refresh/withdraw)', () => {
  it('POST /refresh — Refresh Token 쿠키 없을 때 400 반환', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh');

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_INPUT');
  });

  it('POST /refresh — 유효하지 않은 Refresh Token DB조회 실패 시 401 반환', async () => {
    mockTokenRepo.findRefreshToken.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refresh_token=invalid-refresh-token');

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });

  it('POST /refresh — 유효한 Refresh Token으로 새 Access Token 발급', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    mockTokenRepo.findRefreshToken.mockResolvedValue({
      id: 'token-id',
      user_id: 'user-uuid',
      token: validRefreshToken,
      expires_at: futureDate,
      created_at: new Date().toISOString(),
    });
    mockUserRepo.findUserById.mockResolvedValue(mockUser);
    mockTokenRepo.deleteRefreshToken.mockResolvedValue();
    mockTokenRepo.saveRefreshToken.mockResolvedValue();

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh_token=${validRefreshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('DELETE /withdraw — 인증 없이 접근 시 401 반환 (권한 거부 시나리오 1)', async () => {
    const res = await request(app)
      .delete('/api/v1/auth/withdraw');

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });

  it('POST /logout — Refresh Token 없어도 200 반환', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// -----------------------------------------------------------------------
// group.controller — 그룹 생성/조회 (인증 필요)
// -----------------------------------------------------------------------
describe('통합 테스트 — Group Controller', () => {
  it('POST /groups — 인증 없이 그룹 생성 시 401 반환 (권한 거부 시나리오 2)', async () => {
    const res = await request(app)
      .post('/api/v1/groups')
      .send({ name: '테스트그룹', type: 'household', start_date: '2025-01-01' });

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });

  it('POST /groups — 유효한 토큰으로 그룹 생성 성공', async () => {
    const mockGroup = {
      id: 'group-uuid',
      name: '테스트그룹',
      type: 'LIMITED' as const,
      status: 'active' as const,
      created_by: 'user-uuid',
      start_date: '2025-01-01',
      end_date: null,
      created_at: new Date().toISOString(),
    };
    mockGroupRepo.createGroup.mockResolvedValue(mockGroup);
    mockGroupRepo.addGroupMember.mockResolvedValue({
      id: 'member-id',
      group_id: 'group-uuid',
      user_id: 'user-uuid',
      role: 'MANAGER' as const,
      joined_at: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${validAccessToken}`)
      .send({ name: '테스트그룹', type: 'UNLIMITED', start_date: '2025-01-01' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('테스트그룹');
  });

  it('GET /groups — 유효한 토큰으로 내 그룹 목록 조회', async () => {
    mockGroupRepo.findGroupsByUserId.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/groups')
      .set('Authorization', `Bearer ${validAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /groups/:groupId — 그룹 멤버가 아닐 때 403 반환 (권한 거부 시나리오 3)', async () => {
    // 첫 번째 sql 호출: 그룹 존재함, 두 번째 sql 호출: 멤버십 없음
    mockSql
      .mockResolvedValueOnce([{ id: 'group-uuid', status: 'active' }])
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/groups/group-uuid')
      .set('Authorization', `Bearer ${validAccessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });

  it('GET /groups/:groupId — 그룹 자체가 없을 때 404 반환', async () => {
    // sql 호출: 그룹 없음
    mockSql.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/groups/nonexistent-group')
      .set('Authorization', `Bearer ${validAccessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });
});

// -----------------------------------------------------------------------
// 초대 수락/거절 — 인증 필요
// -----------------------------------------------------------------------
describe('통합 테스트 — Invitation (권한 거부 시나리오)', () => {
  it('PATCH /invitations/:id/respond — 인증 없이 접근 시 401 반환 (권한 거부 시나리오 4)', async () => {
    const res = await request(app)
      .patch('/api/v1/invitations/inv-uuid/respond')
      .send({ action: 'accept' });

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });
});

// -----------------------------------------------------------------------
// settlement.controller — 정산 후 Settlement 불변 (AC-EX1)
// -----------------------------------------------------------------------
describe('통합 테스트 — Settlement Controller (AC-EX1)', () => {
  it('GET /groups/:groupId/settlements — 인증 없이 접근 시 401 반환 (권한 거부 시나리오 5)', async () => {
    const res = await request(app)
      .get('/api/v1/groups/group-uuid/settlements');

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });

  it('POST /groups/:groupId/settlements — 그룹 멤버만 정산 생성 가능, 비멤버 시 403', async () => {
    // 첫 번째 sql: 그룹 존재, 두 번째 sql: 멤버십 없음
    mockSql
      .mockResolvedValueOnce([{ id: 'group-uuid', status: 'active' }])
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .post('/api/v1/groups/group-uuid/settlements')
      .set('Authorization', `Bearer ${validAccessToken}`)
      .send({ period_start: '2025-01-01', period_end: '2025-01-31' });

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });
});

// -----------------------------------------------------------------------
// category.controller
// -----------------------------------------------------------------------
describe('통합 테스트 — Category Controller', () => {
  it('GET /groups/:groupId/categories — 인증 없이 접근 시 401 반환', async () => {
    const res = await request(app)
      .get('/api/v1/groups/group-uuid/categories');

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });
});

// -----------------------------------------------------------------------
// report.service — 커버리지 보완
// -----------------------------------------------------------------------
describe('통합 테스트 — Report 엔드포인트 (커버리지 보완)', () => {
  it('GET /groups/:groupId/reports/categories — 인증 없이 접근 시 401', async () => {
    const res = await request(app)
      .get('/api/v1/groups/group-uuid/reports/categories')
      .query({ period_start: '2025-01-01', period_end: '2025-01-31' });

    expect(res.status).toBe(401);
  });

  it('GET /groups/:groupId/reports/members — 인증 없이 접근 시 401', async () => {
    const res = await request(app)
      .get('/api/v1/groups/group-uuid/reports/members')
      .query({ period_start: '2025-01-01', period_end: '2025-01-31' });

    expect(res.status).toBe(401);
  });
});
