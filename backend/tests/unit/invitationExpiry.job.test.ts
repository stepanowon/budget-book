import { expirePendingInvitations } from '../../src/jobs/invitationExpiry.job';

const mockSql = jest.fn();

jest.mock('../../src/lib/db', () => ({
  sql: new Proxy(
    Object.assign(
      (...args: unknown[]) => mockSql(...args),
      { [Symbol.iterator]: undefined },
    ),
    {
      get: (_target: unknown, prop: string) => {
        if (prop === 'then') return undefined;
        return (...args: unknown[]) => mockSql(prop, ...args);
      },
      apply: (_target: unknown, _this: unknown, args: unknown[]) => mockSql(...args),
    },
  ),
}));

// postgres.js sql 태그 함수 mock: sql`...` 호출 시 mockSql 반환
jest.mock('../../src/lib/db', () => {
  const tag = jest.fn();
  return { sql: tag };
});

const { sql } = require('../../src/lib/db');

beforeEach(() => jest.clearAllMocks());

describe('invitationExpiry.job — expirePendingInvitations (BE-27)', () => {
  it('정상 실행 시 만료 건수 로그 기록', async () => {
    sql.mockResolvedValue([{ count: 3 }]);
    const infoSpy = jest.spyOn(console, 'info').mockImplementation();

    await expirePendingInvitations();

    expect(infoSpy).toHaveBeenCalledWith(
      '[BATCH] expire_pending_invitations completed',
      expect.objectContaining({ expiredCount: 3 }),
    );
    infoSpy.mockRestore();
  });

  it('0건 처리 시 오류 없이 완료', async () => {
    sql.mockResolvedValue([{ count: 0 }]);
    const infoSpy = jest.spyOn(console, 'info').mockImplementation();

    await expirePendingInvitations();

    expect(infoSpy).toHaveBeenCalledWith(
      '[BATCH] expire_pending_invitations completed',
      expect.objectContaining({ expiredCount: 0 }),
    );
    infoSpy.mockRestore();
  });

  it('예상치 못한 예외 시 error 로그, 프로세스 계속 동작', async () => {
    sql.mockRejectedValue(new Error('Network error'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(expirePendingInvitations()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      '[BATCH] expire_pending_invitations unexpected error',
      expect.objectContaining({ message: 'Network error' }),
    );
    errorSpy.mockRestore();
  });
});
