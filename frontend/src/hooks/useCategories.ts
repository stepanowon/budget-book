import { useQuery } from '@tanstack/react-query';
import * as categoryApi from '@/api/categoryApi';

const CATEGORY_KEYS = {
  list: (groupId: string) => ['categories', groupId] as const,
};

export function useCategories(groupId: string) {
  return useQuery({
    queryKey: CATEGORY_KEYS.list(groupId),
    queryFn: () => categoryApi.getCategories(groupId),
    enabled: Boolean(groupId),
  });
}
