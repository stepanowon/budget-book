import { sql } from '../lib/db';
import { User } from '../types/domain';

export async function findUserByEmail(email: string): Promise<User | null> {
  const [row] = await sql`SELECT * FROM users WHERE email = ${email}`;
  return (row as User) ?? null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const [row] = await sql`SELECT * FROM users WHERE username = ${username}`;
  return (row as User) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const [row] = await sql`SELECT * FROM users WHERE id = ${id}`;
  return (row as User) ?? null;
}

export async function createUser(params: {
  username: string;
  email: string;
  password_hash: string;
}): Promise<User> {
  const [row] = await sql`
    INSERT INTO users (username, email, password_hash)
    VALUES (${params.username}, ${params.email}, ${params.password_hash})
    RETURNING *
  `;
  return row as User;
}

export async function deactivateUser(id: string): Promise<void> {
  await sql`UPDATE users SET status = 'inactive' WHERE id = ${id}`;
}

export async function updatePasswordHash(id: string, password_hash: string): Promise<void> {
  await sql`UPDATE users SET password_hash = ${password_hash} WHERE id = ${id}`;
}
