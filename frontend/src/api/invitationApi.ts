import apiClient from '@/api/client';
import type {
  InvitationResponse,
  SendInvitationRequest,
  ApiResponse,
} from '@/types/api';

export async function sendInvitation(
  groupId: string,
  data: SendInvitationRequest,
): Promise<void> {
  await apiClient.post(`/groups/${groupId}/invitations`, data);
}

export async function getMyInvitations(): Promise<InvitationResponse[]> {
  const response =
    await apiClient.get<ApiResponse<InvitationResponse[]>>('/invitations/my');
  return response.data.data;
}

export async function respondToInvitation(
  invitationId: string,
  action: 'ACCEPT' | 'DECLINE',
): Promise<void> {
  await apiClient.patch(`/invitations/${invitationId}`, { action });
}
