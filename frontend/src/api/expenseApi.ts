import apiClient from '@/api/client';
import type {
  ExpenseResponse,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ApiResponse,
} from '@/types/api';

export interface ExpenseFilterParams {
  date_from?: string;
  date_to?: string;
  category_id?: string;
}

export async function getExpenses(
  groupId: string,
  filters?: ExpenseFilterParams,
): Promise<ExpenseResponse[]> {
  const params: Record<string, string> = {};
  if (filters?.date_from) params.date_from = filters.date_from;
  if (filters?.date_to) params.date_to = filters.date_to;
  if (filters?.category_id) params.category_id = filters.category_id;

  const response = await apiClient.get<ApiResponse<ExpenseResponse[]>>(
    `/groups/${groupId}/expenses`,
    { params },
  );
  return response.data.data;
}

export async function getExpense(
  groupId: string,
  expenseId: string,
): Promise<ExpenseResponse> {
  const response = await apiClient.get<ApiResponse<ExpenseResponse>>(
    `/groups/${groupId}/expenses/${expenseId}`,
  );
  return response.data.data;
}

export async function createExpense(
  groupId: string,
  data: CreateExpenseRequest,
): Promise<ExpenseResponse> {
  const response = await apiClient.post<ApiResponse<ExpenseResponse>>(
    `/groups/${groupId}/expenses`,
    data,
  );
  return response.data.data;
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  data: UpdateExpenseRequest,
): Promise<ExpenseResponse> {
  const response = await apiClient.patch<ApiResponse<ExpenseResponse>>(
    `/groups/${groupId}/expenses/${expenseId}`,
    data,
  );
  return response.data.data;
}

export async function deleteExpense(
  groupId: string,
  expenseId: string,
): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/expenses/${expenseId}`);
}
