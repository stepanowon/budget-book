import { sql } from '../lib/db';
import { Invitation } from '../types/domain';

export async function createInvitation(params: {
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  expires_at: string;
}): Promise<Invitation> {
  const [row] = await sql`
    INSERT INTO invitations (group_id, inviter_id, invitee_id, status, expires_at)
    VALUES (${params.group_id}, ${params.inviter_id}, ${params.invitee_id}, 'PENDING', ${params.expires_at})
    RETURNING *
  `;
  return row as Invitation;
}

export async function findPendingInvitation(
  groupId: string,
  inviteeId: string,
): Promise<Invitation | null> {
  const [row] = await sql`
    SELECT * FROM invitations
    WHERE group_id = ${groupId} AND invitee_id = ${inviteeId} AND status = 'PENDING'
  `;
  return (row as Invitation) ?? null;
}

export async function findInvitationById(id: string): Promise<Invitation | null> {
  const [row] = await sql`SELECT * FROM invitations WHERE id = ${id}`;
  return (row as Invitation) ?? null;
}

export async function updateInvitationStatus(id: string, status: string): Promise<Invitation> {
  const [row] = await sql`
    UPDATE invitations SET status = ${status} WHERE id = ${id} RETURNING *
  `;
  return row as Invitation;
}

export async function findGroupInvitations(groupId: string): Promise<Invitation[]> {
  const rows = await sql`
    SELECT * FROM invitations WHERE group_id = ${groupId} ORDER BY created_at DESC
  `;
  return rows as unknown as Invitation[];
}
