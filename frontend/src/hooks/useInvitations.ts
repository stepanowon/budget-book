import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as invitationApi from '@/api/invitationApi';

const INVITATION_KEYS = {
  my: ['invitations', 'my'] as const,
};

export function useMyInvitations() {
  return useQuery({
    queryKey: INVITATION_KEYS.my,
    queryFn: invitationApi.getMyInvitations,
  });
}

export function useSendInvitation(groupId: string) {
  return useMutation({
    mutationFn: (invitee_username: string) =>
      invitationApi.sendInvitation(groupId, { invitee_username }),
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          return new Error('이미 초대된 사용자입니다.');
        }
        if (error.response?.status === 404) {
          return new Error('사용자를 찾을 수 없습니다.');
        }
      }
    },
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      action,
    }: {
      invitationId: string;
      action: 'ACCEPT' | 'DECLINE';
    }) => invitationApi.respondToInvitation(invitationId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.my });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          return new Error('이미 초대된 사용자입니다.');
        }
        if (error.response?.status === 404) {
          return new Error('사용자를 찾을 수 없습니다.');
        }
      }
    },
  });
}
