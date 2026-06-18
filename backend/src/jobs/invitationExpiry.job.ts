import { sql } from '../lib/db';

export async function expirePendingInvitations(): Promise<void> {
  try {
    const [result] = await sql`SELECT expire_pending_invitations() AS count`;
    const count = (result as unknown as { count: number }).count;
    console.info('[BATCH] expire_pending_invitations completed', {
      expiredCount: count,
      executedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[BATCH] expire_pending_invitations unexpected error', { message: msg });
  }
}

export function startInvitationExpiryJob(): NodeJS.Timeout {
  const INTERVAL_MS = 30 * 60 * 1000; // 30분
  console.info('[BATCH] Invitation expiry job started', { intervalMs: INTERVAL_MS });
  return setInterval(expirePendingInvitations, INTERVAL_MS);
}
