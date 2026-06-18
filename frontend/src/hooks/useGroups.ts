import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupApi from '@/api/groupApi';
import type { CreateGroupRequest, UpdateGroupRequest } from '@/types/api';

const GROUP_KEYS = {
  all: ['groups'] as const,
  detail: (groupId: string) => ['groups', groupId] as const,
  members: (groupId: string) => ['groups', groupId, 'members'] as const,
};

export function useGroups() {
  return useQuery({
    queryKey: GROUP_KEYS.all,
    queryFn: groupApi.getGroups,
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: GROUP_KEYS.detail(groupId),
    queryFn: () => groupApi.getGroup(groupId),
    enabled: Boolean(groupId),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupRequest) => groupApi.createGroup(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_KEYS.all });
    },
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGroupRequest) =>
      groupApi.updateGroup(groupId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_KEYS.all });
    },
  });
}

export function useDeactivateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupApi.deactivateGroup(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_KEYS.all });
    },
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: GROUP_KEYS.members(groupId),
    queryFn: () => groupApi.getGroupMembers(groupId),
    enabled: Boolean(groupId),
  });
}

export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupApi.removeGroupMember(groupId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_KEYS.members(groupId) });
    },
  });
}
