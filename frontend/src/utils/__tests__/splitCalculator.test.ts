import { describe, it, expect } from 'vitest';
import { calculateEqualSplit } from '../splitCalculator';

describe('calculateEqualSplit', () => {
  it('3명이 10원을 나눌 때 결제자에게 나머지 1원이 귀속된다', () => {
    const result = calculateEqualSplit(10, ['a', 'b', 'c'], 'a');
    expect(result).toEqual({ a: 4, b: 3, c: 3 });
  });

  it('3명이 9원을 균등 분배한다', () => {
    const result = calculateEqualSplit(9, ['a', 'b', 'c'], 'a');
    expect(result).toEqual({ a: 3, b: 3, c: 3 });
  });

  it('1명이 전액을 부담한다', () => {
    const result = calculateEqualSplit(10000, ['a'], 'a');
    expect(result).toEqual({ a: 10000 });
  });

  it('2명이 10원을 나눌 때 나머지 0원이다', () => {
    const result = calculateEqualSplit(10, ['a', 'b'], 'a');
    expect(result).toEqual({ a: 5, b: 5 });
  });

  it('2명이 11원을 나눌 때 결제자에게 나머지가 귀속된다', () => {
    const result = calculateEqualSplit(11, ['a', 'b'], 'a');
    expect(result).toEqual({ a: 6, b: 5 });
  });

  it('결제자가 목록의 마지막 위치여도 올바르게 처리된다', () => {
    const result = calculateEqualSplit(10, ['a', 'b', 'c'], 'c');
    expect(result).toEqual({ a: 3, b: 3, c: 4 });
  });

  it('참여자가 없으면 빈 객체를 반환한다', () => {
    const result = calculateEqualSplit(10000, [], 'a');
    expect(result).toEqual({});
  });

  it('분배 합산이 항상 totalAmount와 일치한다', () => {
    const result = calculateEqualSplit(100, ['a', 'b', 'c'], 'a');
    const sum = Object.values(result).reduce((acc, v) => acc + v, 0);
    expect(sum).toBe(100);
  });
});
