import { calculateEqualSplit, validateCustomSplit } from '../../src/utils/splitCalculator';

describe('균등 분배 계산 (BE-09, AC-ES1)', () => {
  it('10,000원 3명: 결제자 3,334원, 나머지 각 3,333원', () => {
    const result = calculateEqualSplit(10000, ['user1', 'user2', 'user3'], 'user1');
    const payer = result.find((r) => r.userId === 'user1')!;
    const others = result.filter((r) => r.userId !== 'user1');
    expect(payer.amount).toBe(3334);
    others.forEach((o) => expect(o.amount).toBe(3333));
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(10000);
  });

  it('10,000원 4명: 각 2,500원 (나머지 0)', () => {
    const result = calculateEqualSplit(10000, ['u1', 'u2', 'u3', 'u4'], 'u1');
    result.forEach((r) => expect(r.amount).toBe(2500));
  });

  it('7,000원 3명: 결제자 2,334원, 나머지 각 2,333원', () => {
    const result = calculateEqualSplit(7000, ['user1', 'user2', 'user3'], 'user1');
    const payer = result.find((r) => r.userId === 'user1')!;
    expect(payer.amount).toBe(2334);
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(7000);
  });

  it('paid_by가 participants에 없으면 자동 추가된다 (BR-06)', () => {
    const result = calculateEqualSplit(10000, ['user2', 'user3'], 'user1');
    expect(result).toHaveLength(3);
    const payer = result.find((r) => r.userId === 'user1');
    expect(payer).toBeDefined();
  });

  it('합계가 항상 totalAmount와 일치한다', () => {
    for (const [total, count] of [[9999, 7], [1, 3], [100000, 9]] as [number, number][]) {
      const participants = Array.from({ length: count }, (_, i) => `user${i}`);
      const result = calculateEqualSplit(total, participants, 'user0');
      expect(result.reduce((s, r) => s + r.amount, 0)).toBe(total);
    }
  });
});

describe('개별 입력 분담 검증 (DR-04)', () => {
  it('합산이 total_amount와 일치하면 isValid=true', () => {
    const { isValid } = validateCustomSplit(10000, [
      { userId: 'u1', amount: 5000 },
      { userId: 'u2', amount: 5000 },
    ], 'u1');
    expect(isValid).toBe(true);
  });

  it('합산이 total_amount와 불일치하면 isValid=false (AC-ES3)', () => {
    const { isValid } = validateCustomSplit(10000, [
      { userId: 'u1', amount: 4000 },
      { userId: 'u2', amount: 5000 },
    ], 'u1');
    expect(isValid).toBe(false);
  });
});
