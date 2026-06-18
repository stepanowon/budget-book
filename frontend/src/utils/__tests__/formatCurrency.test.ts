import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../formatCurrency';

describe('formatCurrency', () => {
  it('0원을 반환한다', () => {
    expect(formatCurrency(0)).toBe('0원');
  });

  it('1000을 1,000원으로 변환한다', () => {
    expect(formatCurrency(1000)).toBe('1,000원');
  });

  it('999999999를 999,999,999원으로 변환한다', () => {
    expect(formatCurrency(999_999_999)).toBe('999,999,999원');
  });

  it('1원을 1원으로 반환한다', () => {
    expect(formatCurrency(1)).toBe('1원');
  });

  it('10000을 10,000원으로 변환한다', () => {
    expect(formatCurrency(10000)).toBe('10,000원');
  });

  it('음수도 처리한다', () => {
    expect(formatCurrency(-1000)).toBe('-1,000원');
  });
});
