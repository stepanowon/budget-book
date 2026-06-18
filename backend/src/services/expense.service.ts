import * as expenseRepo from '../repositories/expense.repository';
import * as categoryRepo from '../repositories/category.repository';
import { calculateEqualSplit, validateCustomSplit } from '../utils/splitCalculator';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../middlewares/errorHandler.middleware';
import { SPLIT_TYPE } from '../constants/expense';
import { Expense, ExpenseSplit } from '../types/domain';

interface CreateExpenseParams {
  group_id: string;
  category_id: string;
  paid_by: string;
  total_amount: number;
  split_type: string;
  description?: string;
  date: string;
  participants?: string[];
  splits?: Array<{ user_id: string; amount: number }>;
}

interface UpdateExpenseParams {
  category_id?: string;
  total_amount?: number;
  split_type?: string;
  description?: string;
  date?: string;
  paid_by?: string;
  participants?: string[];
  splits?: Array<{ user_id: string; amount: number }>;
}

function calcSplits(
  totalAmount: number,
  splitType: string,
  paidBy: string,
  participants?: string[],
  splits?: Array<{ user_id: string; amount: number }>,
): Array<{ user_id: string; amount: number }> {
  if (splitType === SPLIT_TYPE.EQUAL) {
    const participantIds = participants && participants.length > 0 ? participants : [paidBy];
    const rawSplits = calculateEqualSplit(totalAmount, participantIds, paidBy);
    return rawSplits.map((s) => ({ user_id: s.userId, amount: s.amount }));
  }

  // CUSTOM
  if (!splits || splits.length === 0) {
    throw new ValidationError('CUSTOM 분담 내역이 필요합니다.');
  }
  const rawSplits = splits.map((s) => ({ userId: s.user_id, amount: s.amount }));
  const { isValid, splits: validated } = validateCustomSplit(totalAmount, rawSplits, paidBy);
  if (!isValid) throw new ValidationError('분담 금액의 합계가 총액과 일치하지 않습니다.');
  return validated.map((s) => ({ user_id: s.userId, amount: s.amount }));
}

export async function createExpense(
  _userId: string,
  params: CreateExpenseParams,
): Promise<Expense & { splits: ExpenseSplit[] }> {
  const category = await categoryRepo.findCategoryById(params.category_id);
  if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  if (category.scope === 'GROUP' && category.group_id !== params.group_id) {
    throw new ValidationError('해당 그룹의 카테고리가 아닙니다.');
  }

  const splitResults = calcSplits(
    params.total_amount,
    params.split_type,
    params.paid_by,
    params.participants,
    params.splits,
  );

  const expense = await expenseRepo.createExpense({
    group_id: params.group_id,
    category_id: params.category_id,
    paid_by: params.paid_by,
    created_by: _userId,
    total_amount: params.total_amount,
    split_type: params.split_type,
    description: params.description,
    date: params.date,
  });

  const expenseSplits = await expenseRepo.createExpenseSplits(
    splitResults.map((s) => ({ expense_id: expense.id, user_id: s.user_id, amount: s.amount })),
  );

  console.info('[EXPENSE] Created', { expenseId: expense.id, groupId: params.group_id });
  return { ...expense, splits: expenseSplits };
}

export async function getExpenses(
  groupId: string,
  filters: {
    date_from?: string;
    date_to?: string;
    category_id?: string;
    page: number;
    limit: number;
  },
): Promise<{ expenses: (Expense & { splits: ExpenseSplit[] })[]; total: number }> {
  return expenseRepo.findExpensesByGroup(groupId, filters);
}

export async function getExpenseDetail(
  expenseId: string,
  groupId: string,
): Promise<Expense & { splits: ExpenseSplit[] }> {
  const expense = await expenseRepo.findExpenseById(expenseId);
  if (!expense) throw new NotFoundError('지출을 찾을 수 없습니다.');
  if (expense.group_id !== groupId) throw new ForbiddenError('접근 권한이 없습니다.');
  return expense;
}

export async function updateExpense(
  expenseId: string,
  groupId: string,
  userId: string,
  groupRole: string,
  params: UpdateExpenseParams,
): Promise<(Expense & { splits: ExpenseSplit[] }) | null> {
  const expense = await expenseRepo.findExpenseById(expenseId);
  if (!expense) throw new NotFoundError('지출을 찾을 수 없습니다.');
  if (expense.group_id !== groupId) throw new ForbiddenError('접근 권한이 없습니다.');

  if (groupRole === 'MEMBER' && expense.paid_by !== userId) {
    throw new ForbiddenError('본인이 등록한 지출만 수정할 수 있습니다.');
  }

  const updateData: Partial<{
    category_id: string;
    total_amount: number;
    split_type: string;
    description: string;
    date: string;
    paid_by: string;
  }> = {};
  if (params.category_id !== undefined) updateData.category_id = params.category_id;
  if (params.total_amount !== undefined) updateData.total_amount = params.total_amount;
  if (params.split_type !== undefined) updateData.split_type = params.split_type;
  if (params.description !== undefined) updateData.description = params.description;
  if (params.date !== undefined) updateData.date = params.date;
  if (params.paid_by !== undefined) updateData.paid_by = params.paid_by;

  if (Object.keys(updateData).length > 0) {
    await expenseRepo.updateExpense(expenseId, updateData);
  }

  const needsSplitRecalc =
    params.total_amount !== undefined ||
    params.split_type !== undefined ||
    params.participants !== undefined ||
    params.splits !== undefined;

  if (needsSplitRecalc) {
    const newTotalAmount = params.total_amount ?? expense.total_amount;
    const newSplitType = params.split_type ?? expense.split_type;
    const newPaidBy = params.paid_by ?? expense.paid_by;

    const splitResults = calcSplits(
      newTotalAmount,
      newSplitType,
      newPaidBy,
      params.participants,
      params.splits,
    );

    await expenseRepo.deleteExpenseSplitsByExpenseId(expenseId);
    await expenseRepo.createExpenseSplits(
      splitResults.map((s) => ({ expense_id: expenseId, user_id: s.user_id, amount: s.amount })),
    );
  }

  console.info('[EXPENSE] Updated', { expenseId, groupId });
  return expenseRepo.findExpenseById(expenseId);
}

export async function deleteExpense(
  expenseId: string,
  groupId: string,
  userId: string,
  groupRole: string,
): Promise<void> {
  const expense = await expenseRepo.findExpenseById(expenseId);
  if (!expense) throw new NotFoundError('지출을 찾을 수 없습니다.');
  if (expense.group_id !== groupId) throw new ForbiddenError('접근 권한이 없습니다.');

  if (groupRole === 'MEMBER' && expense.paid_by !== userId) {
    throw new ForbiddenError('본인이 등록한 지출만 삭제할 수 있습니다.');
  }

  await expenseRepo.deleteExpense(expenseId);
  console.info('[EXPENSE] Deleted', { expenseId, groupId });
}
