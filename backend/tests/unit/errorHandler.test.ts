import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../../src/middlewares/errorHandler.middleware';
import { ERROR_CODES } from '../../src/constants/errorCodes';

function makeApp(handler: (req: Request, res: Response, next: NextFunction) => void) {
  const app = express();
  app.use(express.json());
  app.get('/test', handler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler 미들웨어', () => {
  it('AppError를 올바른 HTTP 상태코드와 errorCode로 응답한다', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new AppError(404, ERROR_CODES.NOT_FOUND, '리소스를 찾을 수 없습니다.'));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe(ERROR_CODES.NOT_FOUND);
    expect(res.body.message).toBe('리소스를 찾을 수 없습니다.');
  });

  it('일반 Error는 500 INTERNAL_ERROR로 응답한다', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new Error('예상치 못한 오류'));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it('에러 응답에 스택 트레이스가 포함되지 않는다', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new Error('내부 오류'));
    });

    const res = await request(app).get('/test');
    expect(res.body.stack).toBeUndefined();
  });

  it('AppError에 details를 포함할 수 있다', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new AppError(400, ERROR_CODES.INVALID_INPUT, '잘못된 입력', { field: 'email' }));
    });

    const res = await request(app).get('/test');
    expect(res.body.details).toEqual({ field: 'email' });
  });
});
