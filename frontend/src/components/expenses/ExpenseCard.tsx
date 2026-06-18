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
}

export default function ExpenseCard({
  expense,
  currentUserId,
  currentUserRole,
  categories,
  onEdit,
  onDelete,
  paidByUsername,
}: ExpenseCardProps) {
  const category = categories.find((c) => c.id === expense.category_id);
  const canEditOrDelete =
    expense.created_by === currentUserId || currentUserRole === 'MANAGER';

  return (
    <>
      <style>{`
        .expense-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--space-4);
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }
        .expense-card__body {
          flex: 1;
          min-width: 0;
        }
        .expense-card__top {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
          margin-bottom: var(--space-1);
        }
        .expense-card__amount {
          font-size: 16px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: var(--color-text-primary);
        }
        .expense-card__desc {
          font-size: 14px;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .expense-card__meta {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-top: var(--space-1);
        }
        .expense-card__actions {
          display: flex;
          gap: var(--space-1);
          flex-shrink: 0;
        }
        .expense-card__action-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-neutral);
          padding: var(--space-2);
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius);
          transition: background var(--transition-fast);
        }
        .expense-card__action-btn:hover { background: var(--color-background); }
        .expense-card__action-btn--delete:hover {
          background: var(--color-danger-light);
          color: var(--color-danger);
        }
      `}</style>
      <div className="expense-card">
        <div className="expense-card__body">
          <div className="expense-card__top">
            <span className="expense-card__amount">
              {formatCurrency(expense.total_amount)}
            </span>
            {category && <CategoryChip name={category.name} />}
          </div>
          {expense.description && (
            <div className="expense-card__desc">{expense.description}</div>
          )}
          <div className="expense-card__meta">
            {formatDisplayDate(expense.date)}
            {paidByUsername && ` · 결제자: ${paidByUsername}`}
          </div>
        </div>
        {canEditOrDelete && (
          <div className="expense-card__actions">
            <button
              className="expense-card__action-btn"
              onClick={() => onEdit(expense.id)}
              aria-label="수정"
              type="button"
            >
              <Pencil size={16} />
            </button>
            <button
              className="expense-card__action-btn expense-card__action-btn--delete"
              onClick={() => onDelete(expense.id)}
              aria-label="삭제"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
