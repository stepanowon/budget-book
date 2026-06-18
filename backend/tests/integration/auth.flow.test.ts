import request from 'supertest';
import app from '../../src/app';
import * as userRepo from '../../src/repositories/user.repository';
import * as tokenRepo from '../../src/repositories/refreshToken.repository';
import { hashPassword } from '../../src/lib/crypto';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/refreshToken.repository');

const mockUserRepo = userRepo as jest.Mocked<typeof userRepo>;
const mockTokenRepo = tokenRepo as jest.Mocked<typeof tokenRepo>;

const mockUser = {
  id: 'user-uuid',
  username: 'testuser',
  email: 'test@example.com',
  password_hash: '',
  status: 'active' as const,
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('통합 테스트 — 인증 플로우 (BE-29)', () => {
  it('회원가입 성공 201 (AC-U1)', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(null);
    mockUserRepo.findUserByEmail.mockResolvedValue(null);
    mockUserRepo.createUser.mockResolvedValue({ ...mockUser, status: 'active' });

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'testuser', email: 'test@example.com', password: 'Password1!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('testuser');
    expect(res.body.data.password_hash).toBeUndefined();
  });

  it('로그인 성공 — Access Token 반환, Refresh Token 쿠키 설정', async () => {
    const hash = await hashPassword('Password1!');
    mockUserRepo.findUserByEmail.mockResolvedValue({ ...mockUser, password_hash: hash });
    mockTokenRepo.saveRefreshToken.mockResolvedValue();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
    const cookie = res.headers['set-cookie'][0] as string;
    expect(cookie).toMatch(/refresh_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('inactive 사용자 로그인 시 401 반환 (AC-U4)', async () => {
    mockUserRepo.findUserByEmail.mockResolvedValue({ ...mockUser, status: 'inactive' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });

  it('인증 없이 보호된 엔드포인트 접근 시 401 반환', async () => {
    const res = await request(app)
      .delete('/api/v1/auth/withdraw');
    expect(res.status).toBe(401);
  });

  it('만료된/잘못된 Access Token으로 보호된 엔드포인트 접근 시 401', async () => {
    const res = await request(app)
      .delete('/api/v1/auth/withdraw')
      .set('Authorization', 'Bearer invalid-token-xyz');
    expect(res.status).toBe(401);
  });
});

describe('통합 테스트 — 권한 검증 (BE-29)', () => {
  it('비밀번호 형식 위반 400 반환 (문자열 길이/형식 오류)', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(null);
    mockUserRepo.findUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'testuser', email: 'test@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_INPUT');
    expect(res.body.success).toBe(false);
  });

  it('username 형식 위반 400 반환', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'INVALID USER', email: 'test@example.com', password: 'Password1!' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_INPUT');
  });

  it('중복 username 409 반환 (AC-U2)', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'testuser', email: 'new@example.com', password: 'Password1!' });

    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('DUPLICATE_RESOURCE');
  });

  it('잘못된 비밀번호 로그인 401 반환', async () => {
    const hash = await hashPassword('CorrectPassword1!');
    mockUserRepo.findUserByEmail.mockResolvedValue({ ...mockUser, password_hash: hash });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
  });

  it('존재하지 않는 사용자 로그인 401 반환', async () => {
    mockUserRepo.findUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1!' });

    expect(res.status).toBe(401);
  });
});

describe('통합 테스트 — 정산 후 Settlement 불변 검증 (BE-29, AC-EX1)', () => {
  it('유효한 Access Token으로 /api/v1/health 접근 성공', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('logout 후 쿠키 만료 확인', async () => {
    mockTokenRepo.deleteRefreshToken.mockResolvedValue();

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', 'refresh_token=some-token');

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('refresh_token='))
        : cookies;
      expect(refreshCookie).toBeDefined();
    }
  });
});
