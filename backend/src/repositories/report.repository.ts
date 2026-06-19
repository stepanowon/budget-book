import { sql } from '../lib/db';
import { kstDateToPeriodStartUtc, kstDateToPeriodEndUtc } from '../utils/dateUtils';

export async function getCategoryReport(
  groupId: string,
  periodStart: string,
  periodEnd: string,
) {
  // UTC 변환은 date 필터에 사용하지 않음 — expenses.date는 DATE 타입(KST 기준)
  void kstDateToPeriodStartUtc;
  void kstDateToPeriodEndUtc;

  const rows = await sql`
    SELECT e.category_id, c.name AS category_name, SUM(e.total_amount)::int AS total
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    WHERE e.group_id = ${groupId} AND e.date >= ${periodStart} AND e.date <= ${periodEnd}
    GROUP BY e.category_id, c.name
    ORDER BY total DESC
  `;
  return rows.map((r) => {
    const row = r as unknown as Record<string, unknown>;
    return {
      category_id: row['category_id'] as string,
      category_name: row['category_name'] as string,
      total: row['total'] as number,
    };
  });
}

export async function getMemberReport(
  groupId: string,
  periodStart: string,
  periodEnd: string,
) {
  const shareRows = await sql`
    SELECT es.user_id, u.username, SUM(es.amount)::int AS total_share
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    JOIN users u ON u.id = es.user_id
    WHERE e.group_id = ${groupId} AND e.date >= ${periodStart} AND e.date <= ${periodEnd}
    GROUP BY es.user_id, u.username
  `;
  const paidRows = await sql`
    SELECT e.paid_by AS user_id, SUM(e.total_amount)::int AS total_paid
    FROM expenses e
    WHERE e.group_id = ${groupId} AND e.date >= ${periodStart} AND e.date <= ${periodEnd}
    GROUP BY e.paid_by
  `;
  const paidMap = new Map(
    paidRows.map((r) => {
      const row = r as unknown as Record<string, unknown>;
      return [row['user_id'] as string, row['total_paid'] as number];
    }),
  );
  return shareRows.map((r) => {
    const row = r as unknown as Record<string, unknown>;
    const userId = row['user_id'] as string;
    return {
      user_id: userId,
      username: row['username'] as string,
      total_share: row['total_share'] as number,
      total_paid: paidMap.get(userId) ?? 0,
    };
  });
}

export async function getExpensesForExcel(
  groupId: string,
  periodStart: string,
  periodEnd: string,
): Promise<Record<string, unknown>[]> {
  const rows = await sql`
    SELECT e.*, c.name AS category_name, u.username AS payer_username
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    JOIN users u ON u.id = e.paid_by
    WHERE e.group_id = ${groupId} AND e.date >= ${periodStart} AND e.date <= ${periodEnd}
    ORDER BY e.date ASC
  `;
  if (rows.length === 0) return [];
  const expenseIds = rows.map((r) => (r as unknown as Record<string, unknown>)['id'] as string);
  const splits = await sql`
    SELECT es.*, u.username AS split_username
    FROM expense_splits es
    JOIN users u ON u.id = es.user_id
    WHERE es.expense_id = ANY(${expenseIds})
  `;
  return rows.map((r) => {
    const row = r as unknown as Record<string, unknown>;
    return {
      ...row,
      splits: splits.filter(
        (s) => (s as unknown as Record<string, unknown>)['expense_id'] === row['id'],
      ) as unknown as Record<string, unknown>[],
    };
  });
}

export async function getSettlementForExcel(
  settlementId: string,
): Promise<{ settlement: Record<string, unknown>; details: Record<string, unknown>[] }> {
  const [settlement] = await sql`SELECT * FROM settlements WHERE id = ${settlementId}`;
  if (!settlement) throw new Error('정산을 찾을 수 없습니다.');
  const details = await sql`
    SELECT sd.*, u.username
    FROM settlement_details sd
    JOIN users u ON u.id = sd.user_id
    WHERE sd.settlement_id = ${settlementId}
  `;
  return {
    settlement: settlement as unknown as Record<string, unknown>,
    details: details as unknown as Record<string, unknown>[],
  };
}
