import apiClient from '@/api/client';
import type {
  ApiResponse,
  CreateSettlementRequest,
  SettlementResponse,
  SettlementDetailResponse,
} from '@/types/api';
import type { Settlement, SettlementDetail } from '@/types/domain';

export interface SettlementCreateResponse {
  settlement: Settlement;
  details: SettlementDetail[];
}

export async function createSettlement(
  groupId: string,
  data: CreateSettlementRequest,
): Promise<SettlementCreateResponse> {
  const response = await apiClient.post<ApiResponse<SettlementCreateResponse>>(
    `/groups/${groupId}/settlements`,
    data,
  );
  return response.data.data;
}

export async function getSettlements(
  groupId: string,
): Promise<SettlementResponse[]> {
  const response = await apiClient.get<ApiResponse<SettlementResponse[]>>(
    `/groups/${groupId}/settlements`,
  );
  return response.data.data;
}

export async function getSettlementDetail(
  groupId: string,
  settlementId: string,
): Promise<SettlementDetailResponse[]> {
  const response = await apiClient.get<ApiResponse<SettlementDetailResponse[]>>(
    `/groups/${groupId}/settlements/${settlementId}`,
  );
  return response.data.data;
}
