import request from 'supertest';
import express from 'express';
import { authenticate } from '../../src/middlewares/auth.middleware';
import { errorHandler } from '../../src/middlewares/errorHandler.middleware';
import { signAccessToken } from '../../src/lib/jwt';

const app = express();
app.use(express.json());
app.get('/protected', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});
app.use(errorHandler);

describe('인증 미들웨어 (BE-06)', () => {
  const validUser = { id: 'uuid-123', username: 'testuser', status: 'active' as const };

  it('유효한 Bearer 토큰으로 req.user가 설정된다', async () => {
    const token = signAccessToken(validUser);
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(validUser.id);
  });

  it('토큰 없이 요청하면 401을 반환한다', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });

  it('Bearer 접두어 없는 토큰은 401을 반환한다', async () => {
    const token = signAccessToken(validUser);
    const res = await request(app).get('/protected').set('Authorization', token);
    expect(res.status).toBe(401);
  });

  it('만료된 토큰은 401을 반환한다', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign({ id: 'x', username: 'x', status: 'active' }, process.env.JWT_ACCESS_SECRET, { expiresIn: -1 });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('inactive 사용자 토큰은 401을 반환한다 (AC-U4)', async () => {
    const inactiveUser = { id: 'uuid-456', username: 'inactive', status: 'inactive' as const };
    const token = signAccessToken(inactiveUser);
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });
});
