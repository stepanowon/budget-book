import { sql } from '../lib/db';
import { Group, GroupMember } from '../types/domain';

export async function createGroup(params: {
  name: string;
  type: string;
  start_date: string;
  end_date?: string | null;
  created_by: string;
}): Promise<Group> {
  const [row] = await sql`
    INSERT INTO groups (name, type, status, start_date, end_date, created_by)
    VALUES (${params.name}, ${params.type}, 'active', ${params.start_date}, ${params.end_date ?? null}, ${params.created_by})
    RETURNING *
  `;
  return row as Group;
}

export async function addGroupMember(params: {
  group_id: string;
  user_id: string;
  role: string;
}): Promise<GroupMember> {
  const [row] = await sql`
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (${params.group_id}, ${params.user_id}, ${params.role})
    RETURNING *
  `;
  return row as GroupMember;
}

export async function findGroupsByUserId(
  userId: string,
): Promise<(Group & { my_role: string; member_count: number })[]> {
  const rows = await sql`
    SELECT
      g.*,
      UPPER(g.status::text) AS status,
      gm_me.role       AS my_role,
      COUNT(gm_all.user_id)::int AS member_count
    FROM groups g
    JOIN group_members gm_me  ON gm_me.group_id  = g.id AND gm_me.user_id = ${userId}
    JOIN group_members gm_all ON gm_all.group_id = g.id
    GROUP BY g.id, gm_me.role
    ORDER BY g.created_at DESC
  `;
  return rows as unknown as (Group & { my_role: string; member_count: number })[];
}

export async function findGroupByIdForUser(
  groupId: string,
  userId: string,
): Promise<(Group & { my_role: string; member_count: number }) | null> {
  const [row] = await sql`
    SELECT
      g.*,
      UPPER(g.status::text) AS status,
      gm_me.role       AS my_role,
      COUNT(gm_all.user_id)::int AS member_count
    FROM groups g
    JOIN group_members gm_me  ON gm_me.group_id  = g.id AND gm_me.user_id = ${userId}
    JOIN group_members gm_all ON gm_all.group_id = g.id
    WHERE g.id = ${groupId}
    GROUP BY g.id, gm_me.role
  `;
  return (row as Group & { my_role: string; member_count: number }) ?? null;
}

export async function findGroupById(id: string): Promise<Group | null> {
  const [row] = await sql`SELECT * FROM groups WHERE id = ${id}`;
  return (row as Group) ?? null;
}

export async function updateGroup(
  id: string,
  params: Partial<{
    name: string;
    type: string;
    start_date: string;
    end_date: string | null;
  }>,
): Promise<Group> {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const [row] = await sql`SELECT * FROM groups WHERE id = ${id}`;
    return row as Group;
  }
  const [row] = await sql`
    UPDATE groups SET ${sql(params as Record<string, unknown>, ...entries.map(([k]) => k))}
    WHERE id = ${id}
    RETURNING *
  `;
  return row as Group;
}

export async function deactivateGroup(id: string): Promise<void> {
  await sql`UPDATE groups SET status = 'inactive' WHERE id = ${id}`;
}

export async function findGroupMembers(
  groupId: string,
): Promise<(GroupMember & { username: string })[]> {
  const rows = await sql`
    SELECT gm.*, u.username
    FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    WHERE gm.group_id = ${groupId}
    ORDER BY gm.joined_at ASC
  `;
  return rows as unknown as (GroupMember & { username: string })[];
}

export async function findMembership(
  groupId: string,
  userId: string,
): Promise<GroupMember | null> {
  const [row] = await sql`
    SELECT * FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId}
  `;
  return (row as GroupMember) ?? null;
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await sql`DELETE FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId}`;
}
