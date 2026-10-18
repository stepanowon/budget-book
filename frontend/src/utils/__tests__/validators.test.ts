import { describe, it, expect } from 'vitest';
import { validateAmount, validateDateRange, getUsernameError } from '../validators';

describe('validateAmount', () => {
  it('1은 유효하다', () => {
    expect(validateAmount(1)).toBe(true);
  });

  it('999999999는 유효하다', () => {
    expect(validateAmount(999_999_999)).toBe(true);
  });

  it('0은 유효하지 않다', () => {
    expect(validateAmount(0)).toBe(false);
  });

  it('음수는 유효하지 않다', () => {
    expect(validateAmount(-1)).toBe(false);
  });

  it('1000000000은 유효하지 않다', () => {
    expect(validateAmount(1_000_000_000)).toBe(false);
  });

  it('소수점은 유효하지 않다', () => {
    expect(validateAmount(1.5)).toBe(false);
  });

  it('일반적인 금액은 유효하다', () => {
    expect(validateAmount(30000)).toBe(true);
  });
});

describe('validateDateRange', () => {
  it('start === end이면 유효하다', () => {
    expect(validateDateRange('2026-07-01', '2026-07-01')).toBe(true);
  });

  it('start < end이면 유효하다', () => {
    expect(validateDateRange('2026-07-01', '2026-07-05')).toBe(true);
  });

  it('start > end이면 유효하지 않다', () => {
    expect(validateDateRange('2026-07-05', '2026-07-01')).toBe(false);
  });

  it('다른 달도 올바르게 처리한다', () => {
    expect(validateDateRange('2026-06-30', '2026-07-01')).toBe(true);
  });
});

describe('getUsernameError', () => {
  it('3~20자 영문 소문자·숫자·밑줄은 유효하다', () => {
    expect(getUsernameError('abc')).toBeNull();
    expect(getUsernameError('user_01')).toBeNull();
    expect(getUsernameError('a'.repeat(20))).toBeNull();
  });

  it('비어 있으면 입력 안내를 반환한다', () => {
    expect(getUsernameError('')).toBe('사용자 이름을 입력해 주세요');
  });

  it('2자 이하는 유효하지 않다 (서버는 3자 이상)', () => {
    expect(getUsernameError('ab')).toContain('3자 이상');
  });

  it('21자 이상은 유효하지 않다', () => {
    expect(getUsernameError('a'.repeat(21))).toContain('20자 이하');
  });

  it('대문자·한글·공백·특수문자는 유효하지 않다', () => {
    for (const bad of ['UserName', '홍길동입니다', 'user name', 'user-name', 'user.name', 'user@123']) {
      expect(getUsernameError(bad)).toBe('영문 소문자, 숫자, 밑줄(_)만 사용할 수 있습니다');
    }
  });
});
