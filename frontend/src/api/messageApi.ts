import apiClient from '@/api/client';
import type { ApiResponse, MessageResponse } from '@/types/api';

export async function getMessages(): Promise<MessageResponse[]> {
  const response = await apiClient.get<ApiResponse<{ messages: MessageResponse[]; total: number }>>(
    '/messages',
  );
  return response.data.data.messages;
}
