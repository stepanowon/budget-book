import apiClient from '@/api/client';
import type { ApiResponse, ReportCategoryResponse, ReportMemberResponse } from '@/types/api';
import type { ExpenseFilterParams } from '@/api/expenseApi';

export async function getCategoryReport(
  groupId: string,
  params: { date_from: string; date_to: string },
): Promise<ReportCategoryResponse[]> {
  const response = await apiClient.get<ApiResponse<ReportCategoryResponse[]>>(
    `/groups/${groupId}/reports/categories`,
    { params },
  );
  return response.data.data;
}

export async function getMemberReport(
  groupId: string,
  params: { date_from: string; date_to: string },
): Promise<ReportMemberResponse[]> {
  const response = await apiClient.get<ApiResponse<ReportMemberResponse[]>>(
    `/groups/${groupId}/reports/members`,
    { params },
  );
  return response.data.data;
}

export async function exportExpensesExcel(
  groupId: string,
  params: ExpenseFilterParams,
): Promise<Blob> {
  const response = await apiClient.get(
    `/groups/${groupId}/reports/expenses/export`,
    {
      params,
      responseType: 'blob',
    },
  );
  return response.data as Blob;
}

export async function exportSettlementExcel(
  groupId: string,
  settlementId: string,
): Promise<Blob> {
  const response = await apiClient.get(
    `/groups/${groupId}/reports/settlements/${settlementId}/export`,
    { responseType: 'blob' },
  );
  return response.data as Blob;
}
