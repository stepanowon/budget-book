import request from 'supertest';
import express from 'express';
import { validateBody } from '../../src/middlewares/validate.middleware';
import { signupSchema } from '../../src/validators/auth.schema';
import { createGroupSchema } from '../../src/validators/group.schema';
import { createExpenseSchema } from '../../src/validators/expense.schema';
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

  describe('지출 금액 범위 검증 (AC-ES: 금액 범위 초과)', () => {
    const app = makeApp(createExpenseSchema);
    const base = {
      category_id: '11111111-1111-4111-8111-111111111111',
      total_amount: 10000,
      date: '2026-09-20',
      split_type: 'EQUAL',
      participant_ids: ['22222222-2222-4222-8222-222222222222'],
    };

    it('금액 0원은 422 VALIDATION_FAILED를 반환한다', async () => {
      const res = await request(app).post('/test').send({ ...base, total_amount: 0 });
      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('VALIDATION_FAILED');
    });

    it('금액 1,000,000,000원(상한 초과)은 422를 반환한다', async () => {
      const res = await request(app).post('/test').send({ ...base, total_amount: 1_000_000_000 });
      expect(res.status).toBe(422);
    });

    it('금액 상한 999,999,999원은 통과한다', async () => {
      const res = await request(app).post('/test').send({ ...base, total_amount: 999_999_999 });
      expect(res.status).toBe(200);
    });

    it('날짜 형식 오류나 참여자 0명은 400 INVALID_INPUT을 반환한다', async () => {
      const badDate = await request(app).post('/test').send({ ...base, date: '2026/09/20' });
      expect(badDate.status).toBe(400);
      expect(badDate.body.errorCode).toBe('INVALID_INPUT');

      const noParticipants = await request(app).post('/test').send({ ...base, participant_ids: [] });
      expect(noParticipants.status).toBe(400);
    });
  });
});
