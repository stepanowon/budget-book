import { createExpense, updateExpense, deleteExpense } from '../../src/services/expense.service';
import { deleteCategory } from '../../src/services/category.service';
import * as expenseRepo from '../../src/repositories/expense.repository';
import * as categoryRepo from '../../src/repositories/category.repository';
import * as groupRepo from '../../src/repositories/group.repository';
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from '../../src/middlewares/errorHandler.middleware';

jest.mock('../../src/repositories/expense.repository');
jest.mock('../../src/repositories/category.repository');
jest.mock('../../src/repositories/group.repository');

const mockExpenseRepo = expenseRepo as jest.Mocked<typeof expenseRepo>;
const mockCategoryRepo = categoryRepo as jest.Mocked<typeof categoryRepo>;
const mockGroupRepo = groupRepo as jest.Mocked<typeof groupRepo>;

const groupMembers = ['user-a', 'user-b', 'user-c'].map((user_id, i) => ({
  id: `m${i}`,
  group_id: 'grp-uuid',
  user_id,
  role: 'MEMBER' as const,
  joined_at: new Date().toISOString(),
  username: user_id,
}));

const mockCategory = {
  id: 'cat-uuid',
  name: '식비',
  scope: 'SYSTEM' as const,
  group_id: null,
};

const mockExpense = {
  id: 'exp-uuid',
  group_id: 'grp-uuid',
  category_id: 'cat-uuid',
  paid_by: 'user-a',
  total_amount: 10000,
  split_type: 'EQUAL' as const,
  description: '점심',
  date: '2026-06-15',
  created_by: 'user-a',
  created_at: new Date().toISOString(),
  splits: [
    { id: 's1', expense_id: 'exp-uuid', user_id: 'user-a', amount: 3334 },
    { id: 's2', expense_id: 'exp-uuid', user_id: 'user-b', amount: 3333 },
    { id: 's3', expense_id: 'exp-uuid', user_id: 'user-c', amount: 3333 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGroupRepo.findGroupMembers.mockResolvedValue(groupMembers);
});

describe('expense.service — createExpense EQUAL (BE-19, AC-ES1)', () => {
  it('10,000원 3명 EQUAL: paidBy 3,334 / 나머지 각 3,333', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(mockCategory);
    mockExpenseRepo.createExpense.mockResolvedValue({
      ...mockExpense,
      splits: undefined,
    } as unknown as typeof mockExpense);
    mockExpenseRepo.createExpenseSplits.mockResolvedValue(
      mockExpense.splits as unknown as ReturnType<typeof mockExpenseRepo.createExpenseSplits> extends Promise<infer T> ? T : never,
    );

    await createExpense('user-a', {
      group_id: 'grp-uuid',
      category_id: 'cat-uuid',
      paid_by: 'user-a',
      total_amount: 10000,
      split_type: 'EQUAL',
      date: '2026-06-15',
      participants: ['user-a', 'user-b', 'user-c'],
    });

    const splitsArg = mockExpenseRepo.createExpenseSplits.mock.calls[0][0];
    const paidByEntry = splitsArg.find((s) => s.user_id === 'user-a');
    expect(paidByEntry?.amount).toBe(3334);
    const others = splitsArg.filter((s) => s.user_id !== 'user-a');
    others.forEach((s) => expect(s.amount).toBe(3333));
  });

  it('paidBy가 participants에 없어도 자동 포함 (BR-06)', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(mockCategory);
    mockExpenseRepo.createExpense.mockResolvedValue({
      ...mockExpense,
      splits: undefined,
    } as unknown as typeof mockExpense);
    mockExpenseRepo.createExpenseSplits.mockResolvedValue([] as unknown as ReturnType<typeof mockExpenseRepo.createExpenseSplits> extends Promise<infer T> ? T : never);

    await createExpense('user-a', {
      group_id: 'grp-uuid',
      category_id: 'cat-uuid',
      paid_by: 'user-a',
      total_amount: 6000,
      split_type: 'EQUAL',
      date: '2026-06-15',
      participants: ['user-b', 'user-c'],
    });

    const splitsArg = mockExpenseRepo.createExpenseSplits.mock.calls[0][0];
    const userIds = splitsArg.map((s) => s.user_id);
    expect(userIds).toContain('user-a');
  });

  it('결제자를 입력자와 다른 멤버로 지정해 등록할 수 있다 (created_by는 입력자)', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(mockCategory);
    mockExpenseRepo.createExpense.mockResolvedValue({
      ...mockExpense,
      splits: undefined,
    } as unknown as typeof mockExpense);
    mockExpenseRepo.createExpenseSplits.mockResolvedValue([] as unknown as ReturnType<typeof mockExpenseRepo.createExpenseSplits> extends Promise<infer T> ? T : never);

    await createExpense('user-a', {
      group_id: 'grp-uuid',
      category_id: 'cat-uuid',
      paid_by: 'user-b',
      total_amount: 10000,
      split_type: 'EQUAL',
      date: '2026-06-15',
      participants: ['user-a', 'user-b'],
    });

    expect(mockExpenseRepo.createExpense).toHaveBeenCalledWith(
      expect.objectContaining({ paid_by: 'user-b', created_by: 'user-a' }),
    );
    const splitsArg = mockExpenseRepo.createExpenseSplits.mock.calls[0][0];
    expect(splitsArg.find((s) => s.user_id === 'user-b')?.amount).toBe(5000);
  });

  it('그룹 멤버가 아닌 결제자는 ValidationError', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(mockCategory);

    await expect(
      createExpense('user-a', {
        group_id: 'grp-uuid',
        category_id: 'cat-uuid',
        paid_by: 'outsider',
        total_amount: 10000,
        split_type: 'EQUAL',
        date: '2026-06-15',
        participants: ['user-a'],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mockExpenseRepo.createExpense).not.toHaveBeenCalled();
  });

  it('그룹 멤버가 아닌 참여자가 있으면 ValidationError', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(mockCategory);

    await expect(
      createExpense('user-a', {
        group_id: 'grp-uuid',
        category_id: 'cat-uuid',
        paid_by: 'user-a',
        total_amount: 10000,
        split_type: 'EQUAL',
        date: '2026-06-15',
        participants: ['user-a', 'outsider'],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('존재하지 않는 카테고리 시 NotFoundError', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(null);
    await expect(
      createExpense('user-a', {
        group_id: 'grp-uuid',
        category_id: 'invalid-cat',
        paid_by: 'user-a',
        total_amount: 10000,
        split_type: 'EQUAL',
        date: '2026-06-15',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('expense.service — createExpense CUSTOM (BE-19, AC-ES3)', () => {
  it('CUSTOM 분담 합산 불일치 시 ValidationError', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(mockCategory);

    await expect(
      createExpense('user-a', {
        group_id: 'grp-uuid',
        category_id: 'cat-uuid',
        paid_by: 'user-a',
        total_amount: 10000,
        split_type: 'CUSTOM',
        date: '2026-06-15',
        splits: [
          { user_id: 'user-a', amount: 5000 },
          { user_id: 'user-b', amount: 3000 },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('CUSTOM 올바른 분담 저장 성공', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(mockCategory);
    mockExpenseRepo.createExpense.mockResolvedValue({
      ...mockExpense,
      splits: undefined,
    } as unknown as typeof mockExpense);
    mockExpenseRepo.createExpenseSplits.mockResolvedValue([] as unknown as ReturnType<typeof mockExpenseRepo.createExpenseSplits> extends Promise<infer T> ? T : never);

    await createExpense('user-a', {
      group_id: 'grp-uuid',
      category_id: 'cat-uuid',
      paid_by: 'user-a',
      total_amount: 10000,
      split_type: 'CUSTOM',
      date: '2026-06-15',
      splits: [
        { user_id: 'user-a', amount: 7000 },
        { user_id: 'user-b', amount: 3000 },
      ],
    });

    expect(mockExpenseRepo.createExpenseSplits).toHaveBeenCalledTimes(1);
  });
});

describe('expense.service — deleteExpense (BE-21)', () => {
  it('MEMBER는 결제자가 본인이어도 타인이 입력한 지출은 삭제할 수 없다 (created_by 기준)', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue({ ...mockExpense, paid_by: 'user-b', created_by: 'user-a' });
    await expect(
      deleteExpense('exp-uuid', 'grp-uuid', 'user-b', 'MEMBER'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('MEMBER가 타인 지출 삭제 시도 시 ForbiddenError', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(mockExpense);
    await expect(
      deleteExpense('exp-uuid', 'grp-uuid', 'user-b', 'MEMBER'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('MANAGER는 타인 지출 삭제 가능', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(mockExpense);
    mockExpenseRepo.deleteExpense.mockResolvedValue(undefined);
    await deleteExpense('exp-uuid', 'grp-uuid', 'user-b', 'MANAGER');
    expect(mockExpenseRepo.deleteExpense).toHaveBeenCalledWith('exp-uuid');
  });
});

describe('expense.service — category.service SYSTEM 삭제 (BE-18, AC-C1)', () => {
  it('SYSTEM 카테고리 삭제 시 ForbiddenError', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue({
      id: 'sys-cat',
      name: '식비',
      scope: 'SYSTEM',
      group_id: null,
    });

    await expect(deleteCategory('sys-cat', 'grp-uuid')).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('expense.service — updateExpense (BE-21)', () => {
  it('MEMBER는 결제자가 본인이어도 타인이 입력한 지출은 수정할 수 없다 (created_by 기준)', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue({ ...mockExpense, paid_by: 'user-b', created_by: 'user-a' });

    await expect(
      updateExpense('exp-uuid', 'grp-uuid', 'user-b', 'MEMBER', { total_amount: 5000 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('MEMBER가 결제자가 타인이어도 본인이 입력한 지출은 수정할 수 있다 (created_by 기준)', async () => {
    const own = { ...mockExpense, paid_by: 'user-b', created_by: 'user-a' };
    mockExpenseRepo.findExpenseById.mockResolvedValue(own);
    mockExpenseRepo.updateExpense.mockResolvedValue(own);

    await updateExpense('exp-uuid', 'grp-uuid', 'user-a', 'MEMBER', { description: '수정' });

    expect(mockExpenseRepo.updateExpense).toHaveBeenCalledWith('exp-uuid', { description: '수정' });
  });

  it('그룹 멤버가 아닌 결제자로 변경하면 ValidationError', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(mockExpense);

    await expect(
      updateExpense('exp-uuid', 'grp-uuid', 'user-a', 'MEMBER', { paid_by: 'outsider' }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mockExpenseRepo.updateExpense).not.toHaveBeenCalled();
  });

  it('MEMBER가 타인 지출 수정 시도 시 ForbiddenError', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(mockExpense);

    await expect(
      updateExpense('exp-uuid', 'grp-uuid', 'user-b', 'MEMBER', { total_amount: 5000 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('존재하지 않는 지출 수정 시 NotFoundError', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(null);

    await expect(
      updateExpense('no-exist', 'grp-uuid', 'user-a', 'MANAGER', { total_amount: 5000 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('다른 그룹 지출 수정 시 ForbiddenError', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(mockExpense);

    await expect(
      updateExpense('exp-uuid', 'other-grp', 'user-a', 'MANAGER', { total_amount: 5000 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('MANAGER가 총액 변경 시 EQUAL 분담 재계산', async () => {
    mockExpenseRepo.findExpenseById
      .mockResolvedValueOnce(mockExpense)
      .mockResolvedValueOnce({ ...mockExpense, total_amount: 6000 });
    mockExpenseRepo.updateExpense.mockResolvedValue({ ...mockExpense, total_amount: 6000 });
    mockExpenseRepo.deleteExpenseSplitsByExpenseId.mockResolvedValue(undefined);
    mockExpenseRepo.createExpenseSplits.mockResolvedValue([] as unknown as ReturnType<typeof mockExpenseRepo.createExpenseSplits> extends Promise<infer T> ? T : never);

    await updateExpense('exp-uuid', 'grp-uuid', 'user-b', 'MANAGER', {
      total_amount: 6000,
      participants: ['user-a', 'user-b'],
    });

    expect(mockExpenseRepo.deleteExpenseSplitsByExpenseId).toHaveBeenCalledWith('exp-uuid');
    expect(mockExpenseRepo.createExpenseSplits).toHaveBeenCalledTimes(1);
  });

  it('CUSTOM 분담 불일치 시 ValidationError', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(mockExpense);

    await expect(
      updateExpense('exp-uuid', 'grp-uuid', 'user-a', 'MANAGER', {
        split_type: 'CUSTOM',
        splits: [{ user_id: 'user-a', amount: 3000 }],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('expense.service — getExpenses / getExpenseDetail (BE-20)', () => {
  it('getExpenses: 그룹 지출 목록 반환', async () => {
    const mockResult = { expenses: [mockExpense], total: 1 };
    mockExpenseRepo.findExpensesByGroup.mockResolvedValue(mockResult);

    const result = await (await import('../../src/services/expense.service')).getExpenses(
      'grp-uuid',
      { page: 1, limit: 20 },
    );
    expect(result.total).toBe(1);
    expect(result.expenses).toHaveLength(1);
  });

  it('getExpenseDetail: 존재하지 않는 지출 시 NotFoundError', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(null);

    await expect(
      (await import('../../src/services/expense.service')).getExpenseDetail('no-exist', 'grp-uuid'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('getExpenseDetail: 다른 그룹 지출 접근 시 ForbiddenError', async () => {
    mockExpenseRepo.findExpenseById.mockResolvedValue(mockExpense);

    await expect(
      (await import('../../src/services/expense.service')).getExpenseDetail('exp-uuid', 'other-grp'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('expense.service — category.service getCategories / createGroupCategory (BE-18)', () => {
  it('getCategories: 카테고리 목록 반환', async () => {
    mockCategoryRepo.findCategoriesByGroup.mockResolvedValue([mockCategory]);

    const result = await (await import('../../src/services/category.service')).getCategories('grp-uuid');
    expect(result).toHaveLength(1);
  });

  it('createGroupCategory: 카테고리 생성', async () => {
    const newCat = { id: 'new-cat', name: '교통비', scope: 'GROUP' as const, group_id: 'grp-uuid' };
    mockCategoryRepo.createGroupCategory.mockResolvedValue(newCat);

    const result = await (await import('../../src/services/category.service')).createGroupCategory('grp-uuid', '교통비');
    expect(result.name).toBe('교통비');
  });

  it('deleteCategory: 존재하지 않는 카테고리 시 NotFoundError', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue(null);

    await expect(deleteCategory('no-cat', 'grp-uuid')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deleteCategory: 다른 그룹 카테고리 삭제 시 ForbiddenError', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue({
      id: 'grp-cat',
      name: '교통비',
      scope: 'GROUP',
      group_id: 'other-grp',
    });

    await expect(deleteCategory('grp-cat', 'grp-uuid')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('deleteCategory: GROUP 카테고리 정상 삭제', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValue({
      id: 'grp-cat',
      name: '교통비',
      scope: 'GROUP',
      group_id: 'grp-uuid',
    });
    mockCategoryRepo.deleteGroupCategory.mockResolvedValue(undefined);

    await deleteCategory('grp-cat', 'grp-uuid');
    expect(mockCategoryRepo.deleteGroupCategory).toHaveBeenCalledWith('grp-cat');
  });
});
