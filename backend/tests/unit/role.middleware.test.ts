import type { Request, Response, NextFunction } from 'express';
import { requireActiveGroup } from '../../src/middlewares/role.middleware';
import { ValidationError } from '../../src/middlewares/errorHandler.middleware';

function run(groupStatus?: string) {
  const req = { groupStatus } as unknown as Request;
  const next = jest.fn() as unknown as NextFunction;
  requireActiveGroup(req, {} as Response, next);
  return next as unknown as jest.Mock;
}

describe('requireActiveGroup (FR-G05: 비활성 그룹은 조회만 가능)', () => {
  it('active 그룹은 통과한다', () => {
    const next = run('active');
    expect(next).toHaveBeenCalledWith();
  });

  it('inactive 그룹은 ValidationError(422)로 차단한다', () => {
    const next = run('inactive');
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toBe('비활성화된 그룹에서는 변경할 수 없습니다.');
  });
});
