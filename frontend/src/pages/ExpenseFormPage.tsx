import { useParams, useNavigate } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { useGroupMembers } from '@/hooks/useGroups';
import { useExpense, useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { CreateExpenseRequest } from '@/types/api';

export default function ExpenseFormPage() {
  const { groupId = '', expenseId } = useParams<{
    groupId: string;
    expenseId?: string;
  }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const isEdit = Boolean(expenseId);

  const { data: categories = [] } = useCategories(groupId);
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: existingExpense, isLoading: isLoadingExpense } = useExpense(
    groupId,
    expenseId ?? '',
  );
  const createExpense = useCreateExpense(groupId);
  const updateExpense = useUpdateExpense(groupId, expenseId ?? '');

  function handleCancel() {
    void navigate(ROUTES.GROUP_EXPENSES(groupId));
  }

  function handleSubmit(data: CreateExpenseRequest) {
    if (isEdit && expenseId) {
      updateExpense.mutate(data, {
        onSuccess: () => {
          showToast('지출이 수정되었습니다.', 'success');
          void navigate(ROUTES.GROUP_EXPENSES(groupId));
        },
        onError: () => {
          showToast('수정 중 오류가 발생했습니다.', 'error');
        },
      });
    } else {
      createExpense.mutate(data, {
        onSuccess: () => {
          showToast('지출이 등록되었습니다.', 'success');
          void navigate(ROUTES.GROUP_EXPENSES(groupId));
        },
        onError: () => {
          showToast('등록 중 오류가 발생했습니다.', 'error');
        },
      });
    }
  }

  if (isEdit && isLoadingExpense) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const initialValues = existingExpense
    ? {
        description: existingExpense.description ?? '',
        total_amount: existingExpense.total_amount,
        date: existingExpense.date,
        category_id: existingExpense.category_id,
        split_type: existingExpense.split_type,
        participant_ids: existingExpense.splits.map((s) => s.user_id),
        paid_by: existingExpense.paid_by,
      }
    : undefined;

  return (
    <div className="max-w-[640px]">
      <h1 className="text-xl font-semibold text-[#202124] m-0 mb-6">
        {isEdit ? '지출 수정' : '지출 등록'}
      </h1>
      <ExpenseForm
        categories={categories}
        members={members}
        currentUserId={currentUser?.id ?? ''}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={createExpense.isPending || updateExpense.isPending}
        onCancel={handleCancel}
      />
    </div>
  );
}
