import { Pencil, Trash2 } from 'lucide-react';
import type { ExpenseResponse, CategoryResponse } from '@/types/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDisplayDate } from '@/utils/dateUtils';
import CategoryChip from './CategoryChip';

interface ExpenseCardProps {
  expense: ExpenseResponse;
  currentUserId: string;
  currentUserRole: 'MANAGER' | 'MEMBER';
  categories: CategoryResponse[];
  onEdit: (expenseId: string) => void;
  onDelete: (expenseId: string) => void;
  paidByUsername?: string;
  participantNames?: string[];
}

export default function ExpenseCard({
  expense,
  currentUserId,
  currentUserRole,
  categories,
  onEdit,
  onDelete,
  paidByUsername,
  participantNames,
}: ExpenseCardProps) {
  const category = categories.find((c) => c.id === expense.category_id);
  const canEditOrDelete =
    expense.created_by === currentUserId || currentUserRole === 'MANAGER';

  return (
    <div className="bg-white border border-border rounded p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-base font-bold [font-variant-numeric:tabular-nums] text-[#202124]">
            {formatCurrency(expense.total_amount)}
          </span>
          {category && <CategoryChip name={category.name} />}
        </div>
        {expense.description && (
          <div className="text-sm text-[#202124] whitespace-nowrap overflow-hidden text-ellipsis">
            {expense.description}
          </div>
        )}
        <div className="text-xs text-neutral mt-1">
          <span>{formatDisplayDate(expense.date)}</span>
          {paidByUsername && (
            <>
              <span className="hidden md:inline"> · </span>
              <br className="md:hidden" />
              <span>결제자: {paidByUsername}</span>
            </>
          )}
          {participantNames && participantNames.length > 0 && (
            <span className="hidden md:inline"> · 참여: {participantNames.join(', ')}</span>
          )}
        </div>
      </div>
      {canEditOrDelete && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            className="bg-transparent border-0 cursor-pointer text-neutral p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-[#f8f9fa] transition-colors"
            onClick={() => onEdit(expense.id)}
            aria-label="수정"
            type="button"
          >
            <Pencil size={16} />
          </button>
          <button
            className="bg-transparent border-0 cursor-pointer text-neutral p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-danger-light hover:text-danger transition-colors"
            onClick={() => onDelete(expense.id)}
            aria-label="삭제"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
