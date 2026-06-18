import apiClient from '@/api/client';
import type {
  GroupResponse,
  GroupMemberResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  ApiResponse,
} from '@/types/api';

export async function getGroups(): Promise<GroupResponse[]> {
  const response = await apiClient.get<ApiResponse<GroupResponse[]>>('/groups');
  return response.data.data;
}

export async function getGroup(groupId: string): Promise<GroupResponse> {
  const response = await apiClient.get<ApiResponse<GroupResponse>>(
    `/groups/${groupId}`,
  );
  return response.data.data;
}

export async function createGroup(
  data: CreateGroupRequest,
): Promise<GroupResponse> {
  const response = await apiClient.post<ApiResponse<GroupResponse>>(
    '/groups',
    data,
  );
  return response.data.data;
}

export async function updateGroup(
  groupId: string,
  data: UpdateGroupRequest,
): Promise<GroupResponse> {
  const response = await apiClient.patch<ApiResponse<GroupResponse>>(
    `/groups/${groupId}`,
    data,
  );
  return response.data.data;
}

export async function deactivateGroup(groupId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}`);
}

export async function getGroupMembers(groupId: string): Promise<GroupMemberResponse[]> {
  const response = await apiClient.get<ApiResponse<GroupMemberResponse[]>>(
    `/groups/${groupId}/members`,
  );
  return response.data.data;
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/members/${userId}`);
}
