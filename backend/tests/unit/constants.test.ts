import { ROLE } from '../../src/constants/roles';
import { SPLIT_TYPE, AMOUNT_MIN, AMOUNT_MAX } from '../../src/constants/expense';
import { ERROR_CODES, HTTP_STATUS } from '../../src/constants/errorCodes';

describe('상수 정의 (BE-05)', () => {
  it('ROLE 상수가 MANAGER, MEMBER를 포함한다', () => {
    expect(ROLE.MANAGER).toBe('MANAGER');
    expect(ROLE.MEMBER).toBe('MEMBER');
  });

  it('SPLIT_TYPE 상수가 EQUAL, CUSTOM을 포함한다', () => {
    expect(SPLIT_TYPE.EQUAL).toBe('EQUAL');
    expect(SPLIT_TYPE.CUSTOM).toBe('CUSTOM');
  });

  it('금액 범위 상수가 올바르다', () => {
    expect(AMOUNT_MIN).toBe(1);
    expect(AMOUNT_MAX).toBe(999_999_999);
  });

  it('ERROR_CODES가 7개의 코드를 포함한다', () => {
    const codes = Object.keys(ERROR_CODES);
    expect(codes).toHaveLength(7);
    expect(ERROR_CODES.UNAUTHENTICATED).toBe('UNAUTHENTICATED');
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
    expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });

  it('HTTP_STATUS가 주요 상태 코드를 포함한다', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.CONFLICT).toBe(409);
    expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });
});
