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
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="settlement-detail">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-2)' }}>
        <Button variant="outlined" size="sm" onClick={() => void handleExport()} loading={exportingId}>
          엑셀 내보내기
        </Button>
      </div>
      <table className="settlement-detail__table" aria-label="정산 상세">
        <thead>
          <tr>
            <th>멤버</th>
            <th>결제액</th>
            <th>분담액</th>
            <th>차액</th>
          </tr>
        </thead>
        <tbody>
          {details.map((detail) => {
            const balance = detail.balance;
            return (
              <tr key={detail.user_id}>
                <td>{detail.username}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(detail.total_paid)}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(detail.total_share)}
                </td>
                <td
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700,
                    color: balance >= 0 ? '#1e8e3e' : '#d93025',
                  }}
                >
                  {balance >= 0 ? (
                    <>+{formatCurrency(balance)} <span style={{ fontSize: 12 }}>받을 금액</span></>
                  ) : (
                    <>{formatCurrency(Math.abs(balance))} <span style={{ fontSize: 12 }}>낼 금액</span></>
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

  return (
    <>
      <style>{`
        .settlement-page { display: flex; flex-direction: column; gap: var(--space-8); }
        .settlement-page__title {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-4);
        }
        .settlement-run-form {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          max-width: 480px;
        }
        .settlement-run-form__row {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        .settlement-run-form__field {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          flex: 1;
          min-width: 140px;
        }
        .settlement-run-form__label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .settlement-run-form__input {
          padding: 8px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          font-size: 14px;
          min-height: 44px;
          font-family: var(--font-family);
        }
        .settlement-run-form__error {
          font-size: 12px;
          color: var(--color-danger);
        }
        .settlement-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .settlement-item {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          overflow: hidden;
        }
        .settlement-item__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          cursor: pointer;
          gap: var(--space-3);
        }
        .settlement-item__header:hover { background: var(--color-background); }
        .settlement-item__period {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .settlement-item__meta {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-top: 2px;
        }
        .settlement-item__body {
          border-top: 1px solid var(--color-border);
          padding: var(--space-4);
        }
        .settlement-detail__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .settlement-detail__table th {
          text-align: left;
          padding: var(--space-2) var(--space-3);
          background: var(--color-background);
          color: var(--color-text-secondary);
          font-size: 12px;
          border-bottom: 1px solid var(--color-border);
        }
        .settlement-detail__table td {
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--color-border);
        }
        .settlement-detail__table tr:last-child td { border-bottom: none; }
      `}</style>
      <div className="settlement-page">
        {isManager && (
          <section>
            <h2 className="settlement-page__title">정산 실행</h2>
            <div className="settlement-run-form">
              <div className="settlement-run-form__row">
                <div className="settlement-run-form__field">
                  <label className="settlement-run-form__label" htmlFor="sp-start">
                    시작일
                  </label>
                  <input
                    id="sp-start"
                    className="settlement-run-form__input"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="settlement-run-form__field">
                  <label className="settlement-run-form__label" htmlFor="sp-end">
                    종료일
                  </label>
                  <input
                    id="sp-end"
                    className="settlement-run-form__input"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
              {dateError && (
                <span className="settlement-run-form__error">{dateError}</span>
              )}
              <div>
                <Button onClick={handleRunClick}>정산 실행</Button>
              </div>
            </div>
          </section>
        )}

        <section ref={resultRef}>
          <h2 className="settlement-page__title">정산 내역</h2>
          {isLoadingList ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
              <LoadingSpinner />
            </div>
          ) : settlements.length === 0 ? (
            <EmptyState title="아직 정산 내역이 없습니다" />
          ) : (
            <div className="settlement-list">
              {settlements.map((s) => (
                <div key={s.id} className="settlement-item">
                  <div
                    className="settlement-item__header"
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
                      <div className="settlement-item__period">
                        {formatDisplayDate(s.period_start)} ~ {formatDisplayDate(s.period_end)}
                      </div>
                      <div className="settlement-item__meta">
                        실행일: {formatDisplayDateTime(s.created_at)}
                      </div>
                    </div>
                    <span style={{ color: 'var(--color-neutral)', fontSize: 18 }}>
                      {expandedId === s.id ? '▲' : '▼'}
                    </span>
                  </div>
                  {expandedId === s.id && (
                    <div className="settlement-item__body">
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
