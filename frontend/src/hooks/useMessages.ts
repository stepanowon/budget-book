import { useQuery } from '@tanstack/react-query';
import * as messageApi from '@/api/messageApi';

const MESSAGE_KEYS = {
  all: ['messages'] as const,
};

export function useMessages() {
  return useQuery({
    queryKey: MESSAGE_KEYS.all,
    queryFn: messageApi.getMessages,
  });
}
