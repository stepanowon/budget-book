import { createExpenseSchema, updateExpenseSchema } from '../../src/validators/expense.schema';

const base = {
  category_id: '11111111-1111-4111-8111-111111111111',
  total_amount: 10000,
  date: '2026-09-20',
  split_type: 'EQUAL' as const,
  participant_ids: ['22222222-2222-4222-8222-222222222222'],
};

describe('createExpenseSchema description', () => {
  it('설명이 없으면 통과한다', () => {
    expect(createExpenseSchema.safeParse(base).success).toBe(true);
  });

  it('설명이 null이면 통과한다 (프론트는 빈 설명을 null로 전송)', () => {
    const result = createExpenseSchema.safeParse({ ...base, description: null });
    expect(result.success).toBe(true);
  });

  it('설명이 200자를 넘으면 실패한다', () => {
    const result = createExpenseSchema.safeParse({ ...base, description: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('updateExpenseSchema description', () => {
  it('설명을 null로 지울 수 있다', () => {
    expect(updateExpenseSchema.safeParse({ description: null }).success).toBe(true);
  });
});
