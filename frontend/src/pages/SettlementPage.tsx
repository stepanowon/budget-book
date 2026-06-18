import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGroupMembers } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import {
  useSettlements,
  useSettlementDetail,
  useCreateSettlement,
} from '@/hooks/useSettlement';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDisplayDate, formatDisplayDateTime } from '@/utils/dateUtils';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import * as reportApi from '@/api/reportApi';

function SettlementDetailPanel({
  groupId,
  settlementId,
}: {
  groupId: string;
  settlementId: string;
}) {
  const { data: details = [], isLoading } = useSettlementDetail(groupId, settlementId);
  const [exportingId, setExportingId] = useState(false);
  const { showToast } = useToast();

  async function handleExport() {
    setExportingId(true);
    try {
      const blob = await reportApi.exportSettlementExcel(groupId, settlementId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `정산결과_${settlementId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('내보내기 중 오류가 발생했습니다.', 'error');
    } finally {
      setExportingId(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button variant="outlined" size="sm" onClick={() => void handleExport()} loading={exportingId}>
          엑셀 내보내기
        </Button>
      </div>
      <table className="w-full border-collapse text-sm" aria-label="정산 상세">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 bg-[#f8f9fa] text-neutral font-medium text-xs border-b border-border">멤버</th>
            <th className="text-left px-3 py-2 bg-[#f8f9fa] text-neutral font-medium text-xs border-b border-border">결제액</th>
            <th className="text-left px-3 py-2 bg-[#f8f9fa] text-neutral font-medium text-xs border-b border-border">분담액</th>
            <th className="text-left px-3 py-2 bg-[#f8f9fa] text-neutral font-medium text-xs border-b border-border">차액</th>
          </tr>
        </thead>
        <tbody>
          {details.map((detail) => {
            const balance = detail.balance;
            return (
              <tr key={detail.user_id} className="[&:last-child_td]:border-b-0">
                <td className="px-3 py-2 border-b border-border">{detail.username}</td>
                <td className="px-3 py-2 border-b border-border [font-variant-numeric:tabular-nums]">
                  {formatCurrency(detail.total_paid)}
                </td>
                <td className="px-3 py-2 border-b border-border [font-variant-numeric:tabular-nums]">
                  {formatCurrency(detail.total_share)}
                </td>
                <td
                  className={`px-3 py-2 border-b border-border [font-variant-numeric:tabular-nums] font-bold ${
                    balance >= 0 ? 'text-success' : 'text-danger'
                  }`}
                >
                  {balance >= 0 ? (
                    <>+{formatCurrency(balance)} <span className="text-xs font-normal">받을 금액</span></>
                  ) : (
                    <>{formatCurrency(Math.abs(balance))} <span className="text-xs font-normal">낼 금액</span></>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function SettlementPage() {
  const { groupId = '' } = useParams<{ groupId: string }>();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const { data: members = [] } = useGroupMembers(groupId);
  const { data: settlements = [], isLoading: isLoadingList } = useSettlements(groupId);
  const createSettlement = useCreateSettlement(groupId);

  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [dateError, setDateError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const currentRole =
    members.find((m) => m.user_id === currentUser?.id)?.role ?? 'MEMBER';
  const isManager = currentRole === 'MANAGER';

  function handleRunClick() {
    setDateError('');
    if (!periodStart || !periodEnd) {
      setDateError('시작일과 종료일을 모두 입력해 주세요.');
      return;
    }
    if (periodEnd < periodStart) {
      setDateError('종료일은 시작일 이후여야 합니다.');
      return;
    }
    setShowConfirm(true);
  }

  function handleConfirmCreate() {
    createSettlement.mutate(
      { period_start: periodStart, period_end: periodEnd },
      {
        onSuccess: () => {
          showToast('정산이 완료되었습니다.', 'success');
          setShowConfirm(false);
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        },
        onError: (err: unknown) => {
          setShowConfirm(false);
          const msg = err instanceof Error ? err.message : '정산 중 오류가 발생했습니다.';
          showToast(msg, 'error');
        },
      },
    );
  }

  const dateInputClass =
    'px-3 py-2 border border-border rounded text-sm min-h-[44px] font-sans text-[#202124] bg-white outline-none focus:border-primary transition-colors';

  return (
    <>
      <div className="flex flex-col gap-8">
        {isManager && (
          <section>
            <h2 className="text-xl font-semibold text-[#202124] m-0 mb-4">정산 실행</h2>
            <div className="bg-white border border-border rounded p-6 flex flex-col gap-4 max-w-[480px]">
              <div className="flex gap-4 flex-wrap">
                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                  <label className="text-xs font-medium text-neutral" htmlFor="sp-start">
                    시작일
                  </label>
                  <input
                    id="sp-start"
                    className={dateInputClass}
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                  <label className="text-xs font-medium text-neutral" htmlFor="sp-end">
                    종료일
                  </label>
                  <input
                    id="sp-end"
                    className={dateInputClass}
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
              {dateError && (
                <span className="text-xs text-danger">{dateError}</span>
              )}
              <div>
                <Button onClick={handleRunClick}>정산 실행</Button>
              </div>
            </div>
          </section>
        )}

        <section ref={resultRef}>
          <h2 className="text-xl font-semibold text-[#202124] m-0 mb-4">정산 내역</h2>
          {isLoadingList ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : settlements.length === 0 ? (
            <EmptyState title="아직 정산 내역이 없습니다" />
          ) : (
            <div className="flex flex-col gap-3">
              {settlements.map((s) => (
                <div key={s.id} className="bg-white border border-border rounded overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer gap-3 hover:bg-[#f8f9fa] transition-colors"
                    onClick={() =>
                      setExpandedId((prev) => (prev === s.id ? null : s.id))
                    }
                    role="button"
                    tabIndex={0}
                    aria-expanded={expandedId === s.id}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setExpandedId((prev) => (prev === s.id ? null : s.id));
                      }
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#202124]">
                        {formatDisplayDate(s.period_start)} ~ {formatDisplayDate(s.period_end)}
                      </div>
                      <div className="text-xs text-neutral mt-0.5">
                        실행일: {formatDisplayDateTime(s.created_at)}
                      </div>
                    </div>
                    <span className="text-neutral text-lg">
                      {expandedId === s.id ? '▲' : '▼'}
                    </span>
                  </div>
                  {expandedId === s.id && (
                    <div className="border-t border-border p-4">
                      <SettlementDetailPanel groupId={groupId} settlementId={s.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="정산 실행 확인"
        footer={
          <>
            <Button variant="outlined" onClick={() => setShowConfirm(false)}>
              취소
            </Button>
            <Button
              onClick={handleConfirmCreate}
              loading={createSettlement.isPending}
            >
              실행
            </Button>
          </>
        }
      >
        <p>
          {periodStart && formatDisplayDate(periodStart)} ~{' '}
          {periodEnd && formatDisplayDate(periodEnd)} 기간의 정산을 실행하시겠습니까?
        </p>
      </Modal>
    </>
  );
}
