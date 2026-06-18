import * as categoryRepo from '../repositories/category.repository';
import { NotFoundError, ForbiddenError } from '../middlewares/errorHandler.middleware';
import { Category } from '../types/domain';

export async function getCategories(groupId: string): Promise<Category[]> {
  return categoryRepo.findCategoriesByGroup(groupId);
}

export async function createGroupCategory(groupId: string, name: string): Promise<Category> {
  const category = await categoryRepo.createGroupCategory({ name, group_id: groupId });
  console.info('[CATEGORY] Created', { categoryId: category.id, groupId });
  return category;
}

export async function deleteCategory(categoryId: string, groupId: string): Promise<void> {
  const category = await categoryRepo.findCategoryById(categoryId);
  if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다.');

  // SYSTEM 카테고리 삭제 불가 (AC-C1, BR-10)
  if (category.scope === 'SYSTEM') {
    throw new ForbiddenError('시스템 카테고리는 삭제할 수 없습니다.');
  }

  // 다른 그룹의 카테고리 삭제 불가
  if (category.group_id !== groupId) {
    throw new ForbiddenError('해당 그룹의 카테고리가 아닙니다.');
  }

  // DB 함수로 재분류 + 삭제 (AC-C2, AC-C3)
  await categoryRepo.deleteGroupCategory(categoryId);
  console.info('[CATEGORY] Deleted', { categoryId, groupId });
}
