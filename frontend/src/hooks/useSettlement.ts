import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as settlementApi from '@/api/settlementApi';
import type { CreateSettlementRequest } from '@/types/api';

const SETTLEMENT_KEYS = {
  all: (groupId: string) => ['settlements', groupId] as const,
  detail: (groupId: string, settlementId: string) =>
    ['settlements', groupId, settlementId] as const,
};

export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: SETTLEMENT_KEYS.all(groupId),
    queryFn: () => settlementApi.getSettlements(groupId),
    enabled: Boolean(groupId),
  });
}

export function useSettlementDetail(groupId: string, settlementId: string) {
  return useQuery({
    queryKey: SETTLEMENT_KEYS.detail(groupId, settlementId),
    queryFn: () => settlementApi.getSettlementDetail(groupId, settlementId),
    enabled: Boolean(groupId) && Boolean(settlementId),
  });
}

export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSettlementRequest) =>
      settlementApi.createSettlement(groupId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SETTLEMENT_KEYS.all(groupId),
      });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new Error('MANAGER 권한이 필요합니다');
      }
      throw error;
    },
  });
}
