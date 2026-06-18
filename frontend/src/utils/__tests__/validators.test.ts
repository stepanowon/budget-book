import { describe, it, expect } from 'vitest';
import { validateAmount, validateDateRange } from '../validators';

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
