import { sql } from '../lib/db';
import { Expense, ExpenseSplit } from '../types/domain';

export async function createExpense(params: {
  group_id: string;
  category_id: string;
  paid_by: string;
  created_by: string;
  total_amount: number;
  split_type: string;
  description?: string;
  date: string;
}): Promise<Expense> {
  const [row] = await sql`
    INSERT INTO expenses (group_id, category_id, paid_by, created_by, total_amount, split_type, description, date)
    VALUES (${params.group_id}, ${params.category_id}, ${params.paid_by}, ${params.created_by}, ${params.total_amount},
            ${params.split_type}, ${params.description ?? null}, ${params.date})
    RETURNING *
  `;
  return row as Expense;
}

export async function createExpenseSplits(splits: Array<{
  expense_id: string;
  user_id: string;
  amount: number;
}>): Promise<ExpenseSplit[]> {
  if (splits.length === 0) return [];
  const rows = await sql`INSERT INTO expense_splits ${sql(splits)} RETURNING *`;
  return rows as unknown as ExpenseSplit[];
}

export async function deleteExpenseSplitsByExpenseId(expenseId: string): Promise<void> {
  await sql`DELETE FROM expense_splits WHERE expense_id = ${expenseId}`;
}

export async function findExpensesByGroup(
  groupId: string,
  filters: {
    date_from?: string;
    date_to?: string;
    category_id?: string;
    page: number;
    limit: number;
  },
): Promise<{ expenses: (Expense & { splits: ExpenseSplit[] })[]; total: number }> {
  const offset = (filters.page - 1) * filters.limit;

  const conditions = [sql`e.group_id = ${groupId}`];
  if (filters.date_from) conditions.push(sql`e.date >= ${filters.date_from}`);
  if (filters.date_to) conditions.push(sql`e.date <= ${filters.date_to}`);
  if (filters.category_id) conditions.push(sql`e.category_id = ${filters.category_id}`);

  const whereClause = conditions.reduce((acc, cond, i) =>
    i === 0 ? cond : sql`${acc} AND ${cond}`,
  );

  const rows = await sql`
    SELECT e.*, COUNT(*) OVER()::int AS total_count
    FROM expenses e
    WHERE ${whereClause}
    ORDER BY e.date DESC, e.created_at DESC
    LIMIT ${filters.limit} OFFSET ${offset}
  `;

  const total = rows.length > 0 ? (rows[0] as unknown as Record<string, unknown>).total_count as number : 0;

  if (rows.length === 0) return { expenses: [], total };

  const expenseIds = rows.map((r) => (r as unknown as Record<string, unknown>).id as string);
  const splits = await sql`SELECT * FROM expense_splits WHERE expense_id = ANY(${expenseIds})`;

  const expenses = rows.map((row) => {
    const e = { ...(row as unknown as Record<string, unknown>) };
    delete e['total_count'];
    return {
      ...e,
      splits: splits.filter(
        (s) => (s as unknown as Record<string, unknown>).expense_id === e['id'],
      ) as unknown as ExpenseSplit[],
    };
  });

  return { expenses: expenses as unknown as (Expense & { splits: ExpenseSplit[] })[], total };
}

export async function findExpenseById(
  id: string,
): Promise<(Expense & { splits: ExpenseSplit[] }) | null> {
  const [row] = await sql`SELECT * FROM expenses WHERE id = ${id}`;
  if (!row) return null;
  const splits = await sql`SELECT * FROM expense_splits WHERE expense_id = ${id}`;
  return { ...(row as unknown as Expense), splits: splits as unknown as ExpenseSplit[] };
}

export async function updateExpense(
  id: string,
  params: Partial<{
    category_id: string;
    total_amount: number;
    split_type: string;
    description: string;
    date: string;
    paid_by: string;
  }>,
): Promise<Expense> {
  const [row] = await sql`
    UPDATE expenses SET ${sql(params as Record<string, unknown>, ...Object.keys(params))}
    WHERE id = ${id}
    RETURNING *
  `;
  return row as unknown as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await sql`DELETE FROM expenses WHERE id = ${id}`;
}
