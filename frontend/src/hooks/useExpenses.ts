import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as expenseApi from '@/api/expenseApi';
import type { ExpenseFilterParams } from '@/api/expenseApi';
import type { CreateExpenseRequest, UpdateExpenseRequest } from '@/types/api';

const EXPENSE_KEYS = {
  all: (groupId: string) => ['expenses', groupId] as const,
  list: (groupId: string, filters: ExpenseFilterParams) =>
    ['expenses', groupId, filters] as const,
  detail: (groupId: string, expenseId: string) =>
    ['expenses', groupId, expenseId] as const,
};

export function useExpenses(groupId: string) {
  const [filters, setFilters] = useState<ExpenseFilterParams>({});

  const query = useQuery({
    queryKey: EXPENSE_KEYS.list(groupId, filters),
    queryFn: () => expenseApi.getExpenses(groupId, filters),
    enabled: Boolean(groupId),
  });

  return { ...query, filters, setFilters };
}

export function useExpense(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: EXPENSE_KEYS.detail(groupId, expenseId),
    queryFn: () => expenseApi.getExpense(groupId, expenseId),
    enabled: Boolean(groupId) && Boolean(expenseId),
  });
}

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) =>
      expenseApi.createExpense(groupId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: EXPENSE_KEYS.all(groupId),
      });
    },
  });
}

export function useUpdateExpense(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateExpenseRequest) =>
      expenseApi.updateExpense(groupId, expenseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: EXPENSE_KEYS.all(groupId),
      });
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) =>
      expenseApi.deleteExpense(groupId, expenseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: EXPENSE_KEYS.all(groupId),
      });
    },
  });
}
