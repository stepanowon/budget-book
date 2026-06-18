import { sql } from '../lib/db';
import { RefreshToken } from '../types/domain';

export async function saveRefreshToken(params: {
  user_id: string;
  token: string;
  expires_at: string;
}): Promise<void> {
  await sql`
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES (${params.user_id}, ${params.token}, ${params.expires_at})
  `;
}

export async function findRefreshToken(token: string): Promise<RefreshToken | null> {
  const [row] = await sql`SELECT * FROM refresh_tokens WHERE token = ${token}`;
  return (row as RefreshToken) ?? null;
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await sql`DELETE FROM refresh_tokens WHERE token = ${token}`;
}

export async function deleteAllUserRefreshTokens(userId: string): Promise<void> {
  await sql`DELETE FROM refresh_tokens WHERE user_id = ${userId}`;
}
