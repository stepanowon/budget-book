import { sql } from '../lib/db';
import { Category } from '../types/domain';

export async function findCategoriesByGroup(groupId: string): Promise<Category[]> {
  const rows = await sql`
    SELECT * FROM categories
    WHERE scope = 'SYSTEM' OR group_id = ${groupId}
    ORDER BY scope ASC, name ASC
  `;
  return rows as unknown as Category[];
}

export async function findCategoryById(id: string): Promise<Category | null> {
  const [row] = await sql`SELECT * FROM categories WHERE id = ${id}`;
  return (row as Category) ?? null;
}

export async function createGroupCategory(params: {
  name: string;
  group_id: string;
}): Promise<Category> {
  const [row] = await sql`
    INSERT INTO categories (name, scope, group_id)
    VALUES (${params.name}, 'GROUP', ${params.group_id})
    RETURNING *
  `;
  return row as Category;
}

export async function deleteGroupCategory(categoryId: string): Promise<void> {
  await sql`SELECT delete_group_category(${categoryId}::uuid)`;
}
