import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { useGroupMembers, useGroup } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import * as reportApi from '@/api/reportApi';

const filterInputClass =
  'w-full px-2 py-1.5 border border-border rounded text-xs md:text-sm font-sans h-9 text-[#202124] bg-white outline-none focus:border-primary';

export default function ExpenseListPage() {
  const { groupId = '' } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // 사용자가 직접 바꾸기 전까지는 그룹 기간이 기본 조회 기간
  const [dateFromInput, setDateFrom] = useState<string | undefined>();
  const [dateToInput, setDateTo] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: expenses = [], isLoading } = useExpenses(groupId);
  const { data: categories = [] } = useCategories(groupId);
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: group } = useGroup(groupId);
  const deleteExpense = useDeleteExpense(groupId);

  const dateFrom = dateFromInput ?? group?.start_date?.slice(0, 10) ?? '';
  const dateTo = dateToInput ?? group?.end_date?.slice(0, 10) ?? '';

  const filters = {
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    ...(categoryFilter && { category_id: categoryFilter }),
  };

  // 필터는 클라이언트 사이드로 적용 (API가 지원하면 setFilters 사용)
  const filteredExpenses = expenses.filter((e) => {
    if (filters.date_from && e.date < filters.date_from) return false;
    if (filters.date_to && e.date > filters.date_to) return false;
    if (filters.category_id && e.category_id !== filters.category_id) return false;
    return true;
  });

  const currentRole =
    members.find((m) => m.user_id === currentUser?.id)?.role ?? 'MEMBER';

  function getMemberUsername(userId: string): string {
    return members.find((m) => m.user_id === userId)?.username ?? userId;
  }

  function handleEdit(expenseId: string) {
    void navigate(ROUTES.GROUP_EXPENSE_EDIT(groupId, expenseId));
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    deleteExpense.mutate(deleteTargetId, {
      onSuccess: () => {
        showToast('지출이 삭제되었습니다.', 'success');
        setDeleteTargetId(null);
      },
      onError: () => {
        showToast('삭제 중 오류가 발생했습니다.', 'error');
        setDeleteTargetId(null);
      },
    });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await reportApi.exportExpensesExcel(groupId, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const groupName = group?.name ?? groupId;
      const dateRange = `${dateFrom || 'all'}_${dateTo || 'all'}`;
      a.download = `지출내역_${groupName}_${dateRange}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('내보내기 중 오류가 발생했습니다.', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-semibold text-[#202124] m-0">지출 목록</h1>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => void handleExport()}
              loading={exporting}
            >
              <Download size={14} />
              엑셀 내보내기
            </Button>
            <Button
              size="sm"
              onClick={() => void navigate(ROUTES.GROUP_EXPENSE_NEW(groupId))}
            >
              <Plus size={14} />
              지출 등록
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-white border border-border rounded p-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] md:text-xs text-neutral font-medium" htmlFor="date-from">시작일</label>
            <input
              id="date-from"
              className={filterInputClass}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] md:text-xs text-neutral font-medium" htmlFor="date-to">종료일</label>
            <input
              id="date-to"
              className={filterInputClass}
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] md:text-xs text-neutral font-medium" htmlFor="category-filter">카테고리</label>
            <select
              id="category-filter"
              className={filterInputClass}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">전체</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            title="지출 내역이 없습니다"
            description="첫 번째 지출을 등록해 보세요."
            action={{
              label: '지출 등록',
              onClick: () => void navigate(ROUTES.GROUP_EXPENSE_NEW(groupId)),
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currentUserId={currentUser?.id ?? ''}
                currentUserRole={currentRole}
                categories={categories}
                paidByUsername={getMemberUsername(expense.paid_by)}
                participantNames={expense.splits.map((s) => getMemberUsername(s.user_id))}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteTargetId(id)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        title="지출 삭제"
        footer={
          <>
            <Button variant="outlined" onClick={() => setDeleteTargetId(null)}>
              취소
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleteExpense.isPending}
            >
              삭제
            </Button>
          </>
        }
      >
        <p>이 지출 내역을 삭제하시겠습니까?</p>
      </Modal>
    </>
  );
}
