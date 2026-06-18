import request from 'supertest';
import express from 'express';
import { validateBody } from '../../src/middlewares/validate.middleware';
import { signupSchema } from '../../src/validators/auth.schema';
import { createGroupSchema } from '../../src/validators/group.schema';
import { errorHandler } from '../../src/middlewares/errorHandler.middleware';

function makeApp(schema: Parameters<typeof validateBody>[0]) {
  const app = express();
  app.use(express.json());
  app.post('/test', validateBody(schema), (req, res) => {
    res.json({ success: true, data: req.body });
  });
  app.use(errorHandler);
  return app;
}

describe('요청 검증 미들웨어 (BE-08)', () => {
  describe('username 형식 검증', () => {
    const app = makeApp(signupSchema);

    it('유효한 입력은 통과한다', async () => {
      const res = await request(app).post('/test').send({
        username: 'valid_user',
        email: 'test@example.com',
        password: 'Password1!',
      });
      expect(res.status).toBe(200);
    });

    it('대문자 username은 400을 반환한다', async () => {
      const res = await request(app).post('/test').send({
        username: 'InvalidUser',
        email: 'test@example.com',
        password: 'Password1!',
      });
      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_INPUT');
    });

    it('2자 username은 400을 반환한다', async () => {
      const res = await request(app).post('/test').send({
        username: 'ab',
        email: 'test@example.com',
        password: 'Password1!',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('그룹 생성 검증', () => {
    const app = makeApp(createGroupSchema);

    it('LIMITED 타입에 end_date 없으면 422를 반환한다 (AC-G1)', async () => {
      const res = await request(app).post('/test').send({
        name: 'Test Group',
        type: 'LIMITED',
        start_date: '2026-07-01',
      });
      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('VALIDATION_FAILED');
    });

    it('end_date < start_date이면 422를 반환한다 (AC-G2)', async () => {
      const res = await request(app).post('/test').send({
        name: 'Test Group',
        type: 'LIMITED',
        start_date: '2026-07-05',
        end_date: '2026-07-01',
      });
      expect(res.status).toBe(422);
    });

    it('UNLIMITED 타입에 end_date 없어도 통과한다 (AC-G3)', async () => {
      const res = await request(app).post('/test').send({
        name: 'Unlimited Group',
        type: 'UNLIMITED',
        start_date: '2026-07-01',
      });
      expect(res.status).toBe(200);
    });
  });
});
