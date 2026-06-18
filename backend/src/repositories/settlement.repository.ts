import { sql } from '../lib/db';
import { Settlement, SettlementDetail, Message } from '../types/domain';

export async function createSettlement(params: {
  group_id: string;
  period_start: string;
  period_end: string;
  created_by: string;
}): Promise<Settlement> {
  const [row] = await sql`
    INSERT INTO settlements (group_id, period_start, period_end, created_by)
    VALUES (${params.group_id}, ${params.period_start}, ${params.period_end}, ${params.created_by})
    RETURNING *
  `;
  return row as unknown as Settlement;
}

export async function createSettlementDetails(details: Array<{
  settlement_id: string;
  user_id: string;
  total_paid: number;
  total_share: number;
}>): Promise<SettlementDetail[]> {
  if (details.length === 0) return [];
  const rows = await sql`INSERT INTO settlement_details ${sql(details)} RETURNING *`;
  return rows as unknown as SettlementDetail[];
}

export async function createMessages(messages: Array<{
  settlement_id: string;
  recipient_user_id: string;
  content: string;
}>): Promise<Message[]> {
  if (messages.length === 0) return [];
  const rows = await sql`INSERT INTO messages ${sql(messages)} RETURNING *`;
  return rows as unknown as Message[];
}

export async function findSettlementsByGroup(groupId: string): Promise<Settlement[]> {
  const rows = await sql`
    SELECT * FROM settlements WHERE group_id = ${groupId} ORDER BY settled_at DESC
  `;
  return rows as unknown as Settlement[];
}

export async function findSettlementById(id: string): Promise<Settlement | null> {
  const [row] = await sql`SELECT * FROM settlements WHERE id = ${id}`;
  return (row as unknown as Settlement) ?? null;
}

export async function findSettlementDetails(settlementId: string): Promise<SettlementDetail[]> {
  const rows = await sql`
    SELECT sd.*, u.username
    FROM settlement_details sd
    JOIN users u ON u.id = sd.user_id
    WHERE sd.settlement_id = ${settlementId}
  `;
  return rows as unknown as SettlementDetail[];
}

export async function findMessagesByRecipient(
  userId: string,
  page: number,
  limit: number,
): Promise<{ messages: Message[]; total: number }> {
  const offset = (page - 1) * limit;
  const rows = await sql`
    SELECT m.*, COUNT(*) OVER()::int AS total_count,
           s.period_start, s.period_end, s.group_id AS settlement_group_id
    FROM messages m
    JOIN settlements s ON s.id = m.settlement_id
    WHERE m.recipient_user_id = ${userId}
    ORDER BY m.sent_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const total = rows.length > 0
    ? (rows[0] as unknown as Record<string, unknown>).total_count as number
    : 0;
  const messages = rows.map((r) => {
    const m = { ...(r as unknown as Record<string, unknown>) };
    delete m['total_count'];
    return m;
  });
  return { messages: messages as unknown as Message[], total };
}
