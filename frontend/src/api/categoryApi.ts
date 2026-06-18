import apiClient from '@/api/client';
import type { CategoryResponse, ApiResponse } from '@/types/api';

export async function getCategories(
  groupId: string,
): Promise<CategoryResponse[]> {
  const response = await apiClient.get<ApiResponse<CategoryResponse[]>>(
    `/groups/${groupId}/categories`,
  );
  return response.data.data;
}

export async function addGroupCategory(
  groupId: string,
  data: { name: string },
): Promise<CategoryResponse> {
  const response = await apiClient.post<ApiResponse<CategoryResponse>>(
    `/groups/${groupId}/categories`,
    data,
  );
  return response.data.data;
}

export async function deleteGroupCategory(
  groupId: string,
  categoryId: string,
): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/categories/${categoryId}`);
}
