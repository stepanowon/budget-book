import { useState, useEffect } from 'react';
import type { CategoryResponse, GroupMemberResponse } from '@/types/api';
import type { CreateExpenseRequest } from '@/types/api';
import { SPLIT_TYPE } from '@/types/domain';
import { calculateEqualSplit } from '@/utils/splitCalculator';
import { formatCurrency } from '@/utils/formatCurrency';
import Button from '@/components/common/Button';

interface ExpenseFormProps {
  categories: CategoryResponse[];
  members: GroupMemberResponse[];
  currentUserId: string;
  initialValues?: Partial<CreateExpenseRequest & { paid_by: string }>;
  onSubmit: (data: CreateExpenseRequest) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export default function ExpenseForm({
  categories,
  members,
  currentUserId,
  initialValues,
  onSubmit,
  isSubmitting,
  onCancel,
}: ExpenseFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [totalAmount, setTotalAmount] = useState(
    initialValues?.total_amount ? String(initialValues.total_amount) : '',
  );
  const [date, setDate] = useState(initialValues?.date ?? today);
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? '');
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>(
    initialValues?.split_type ?? SPLIT_TYPE.EQUAL,
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    initialValues?.participant_ids ?? [currentUserId],
  );
  const [paidBy, setPaidBy] = useState(
    initialValues?.paid_by ?? currentUserId,
  );
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 결제자는 항상 참여자에 포함
  useEffect(() => {
    if (!participantIds.includes(paidBy)) {
      setParticipantIds((prev) => [...prev, paidBy]);
    }
  }, [paidBy, participantIds]);

  function toggleParticipant(userId: string) {
    if (userId === paidBy) return; // 결제자는 제거 불가
    setParticipantIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  function handleCustomSplitChange(userId: string, value: string) {
    setCustomSplits((prev) => ({ ...prev, [userId]: value }));
  }

  const parsedTotal = parseInt(totalAmount, 10);
  const isValidTotal = !isNaN(parsedTotal) && parsedTotal > 0;

  const equalSplits = isValidTotal && participantIds.length > 0
    ? calculateEqualSplit(parsedTotal, participantIds, paidBy)
    : null;

  const customTotal = participantIds.reduce((sum, id) => {
    const val = parseInt(customSplits[id] ?? '0', 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const customMismatch = isValidTotal && customTotal !== parsedTotal;

  function validate() {
    const errs: Record<string, string> = {};
    if (!totalAmount || !isValidTotal) errs.totalAmount = '유효한 금액을 입력해 주세요.';
    if (!date) errs.date = '날짜를 입력해 주세요.';
    if (!categoryId) errs.categoryId = '카테고리를 선택해 주세요.';
    if (participantIds.length === 0) errs.participants = '참여자를 1명 이상 선택해 주세요.';
    if (splitType === SPLIT_TYPE.CUSTOM && customMismatch) {
      errs.customSplits = `합계가 총액(${formatCurrency(parsedTotal)})과 일치해야 합니다.`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateExpenseRequest = {
      total_amount: parsedTotal,
      category_id: categoryId,
      date,
      description: description || null,
      split_type: splitType,
      participant_ids: participantIds,
    };

    if (splitType === SPLIT_TYPE.CUSTOM) {
      data.custom_splits = participantIds.map((id) => ({
        user_id: id,
        amount: parseInt(customSplits[id] ?? '0', 10),
      }));
    }

    onSubmit(data);
  }

  return (
    <>
      <style>{`
        .expense-form { display: flex; flex-direction: column; gap: var(--space-5); }
        .expense-form__field { display: flex; flex-direction: column; gap: var(--space-1); }
        .expense-form__label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .expense-form__label--required::after {
          content: ' *';
          color: var(--color-danger);
        }
        .expense-form__input,
        .expense-form__select {
          padding: 8px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          font-size: 14px;
          font-family: var(--font-family);
          min-height: 44px;
          color: var(--color-text-primary);
          background: var(--color-surface);
          width: 100%;
          box-sizing: border-box;
        }
        .expense-form__input:focus,
        .expense-form__select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }
        .expense-form__error {
          font-size: 12px;
          color: var(--color-danger);
        }
        .expense-form__radio-group {
          display: flex;
          gap: var(--space-4);
        }
        .expense-form__radio-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 14px;
          cursor: pointer;
          min-height: 44px;
        }
        .expense-form__checkboxes {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .expense-form__checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 14px;
          cursor: pointer;
          min-height: 44px;
        }
        .expense-form__split-preview {
          background: var(--color-primary-light);
          border-radius: var(--border-radius);
          padding: var(--space-3) var(--space-4);
          font-size: 13px;
          color: var(--color-primary);
        }
        .expense-form__custom-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }
        .expense-form__custom-row span { flex: 1; font-size: 14px; }
        .expense-form__custom-input {
          width: 120px;
          padding: 6px 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          font-size: 14px;
          min-height: 44px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .expense-form__custom-total {
          font-size: 13px;
          font-weight: 500;
          margin-top: var(--space-2);
        }
        .expense-form__custom-total--mismatch { color: var(--color-danger); }
        .expense-form__custom-total--ok { color: var(--color-success); }
        .expense-form__actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-2);
          padding-top: var(--space-2);
        }
      `}</style>
      <form className="expense-form" onSubmit={handleSubmit} noValidate>
        <div className="expense-form__field">
          <label className="expense-form__label" htmlFor="ef-description">
            설명
          </label>
          <input
            id="ef-description"
            className="expense-form__input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예: 저녁 식사"
          />
        </div>

        <div className="expense-form__field">
          <label className="expense-form__label expense-form__label--required" htmlFor="ef-amount">
            금액 (원)
          </label>
          <input
            id="ef-amount"
            className="expense-form__input"
            type="number"
            min="1"
            step="1"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          />
          {errors.totalAmount && (
            <span className="expense-form__error">{errors.totalAmount}</span>
          )}
        </div>

        <div className="expense-form__field">
          <label className="expense-form__label expense-form__label--required" htmlFor="ef-date">
            날짜
          </label>
          <input
            id="ef-date"
            className="expense-form__input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && (
            <span className="expense-form__error">{errors.date}</span>
          )}
        </div>

        <div className="expense-form__field">
          <label className="expense-form__label expense-form__label--required" htmlFor="ef-category">
            카테고리
          </label>
          <select
            id="ef-category"
            className="expense-form__select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">카테고리 선택</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <span className="expense-form__error">{errors.categoryId}</span>
          )}
        </div>

        <div className="expense-form__field">
          <span className="expense-form__label">분담 방식</span>
          <div className="expense-form__radio-group">
            <label className="expense-form__radio-label">
              <input
                type="radio"
                value={SPLIT_TYPE.EQUAL}
                checked={splitType === SPLIT_TYPE.EQUAL}
                onChange={() => setSplitType(SPLIT_TYPE.EQUAL)}
              />
              균등 분담
            </label>
            <label className="expense-form__radio-label">
              <input
                type="radio"
                value={SPLIT_TYPE.CUSTOM}
                checked={splitType === SPLIT_TYPE.CUSTOM}
                onChange={() => setSplitType(SPLIT_TYPE.CUSTOM)}
              />
              개별 분담
            </label>
          </div>
        </div>

        <div className="expense-form__field">
          <span className="expense-form__label expense-form__label--required">
            참여자
          </span>
          <div className="expense-form__checkboxes">
            {members.map((m) => (
              <label key={m.user_id} className="expense-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={participantIds.includes(m.user_id)}
                  disabled={m.user_id === paidBy}
                  onChange={() => toggleParticipant(m.user_id)}
                />
                {m.username}
                {m.user_id === paidBy && ' (결제자)'}
              </label>
            ))}
          </div>
          {errors.participants && (
            <span className="expense-form__error">{errors.participants}</span>
          )}
        </div>

        <div className="expense-form__field">
          <label className="expense-form__label expense-form__label--required" htmlFor="ef-paid-by">
            결제자
          </label>
          <select
            id="ef-paid-by"
            className="expense-form__select"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            {members
              .filter((m) => participantIds.includes(m.user_id))
              .map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.username}
                </option>
              ))}
          </select>
        </div>

        {splitType === SPLIT_TYPE.EQUAL && equalSplits && participantIds.length > 0 && (
          <div className="expense-form__split-preview">
            {(() => {
              const paidByMember = members.find((m) => m.user_id === paidBy);
              const paidByAmt = equalSplits[paidBy] ?? 0;
              const baseAmt = Object.values(equalSplits).find((v) => v !== paidByAmt) ?? paidByAmt;
              return `각자 ${formatCurrency(baseAmt)} (결제자 ${paidByMember?.username ?? ''} ${formatCurrency(paidByAmt)})`;
            })()}
          </div>
        )}

        {splitType === SPLIT_TYPE.CUSTOM && (
          <div className="expense-form__field">
            <span className="expense-form__label">참여자별 금액</span>
            {participantIds.map((id) => {
              const member = members.find((m) => m.user_id === id);
              return (
                <div key={id} className="expense-form__custom-row">
                  <span>{member?.username ?? id}</span>
                  <input
                    className="expense-form__custom-input"
                    type="number"
                    min="0"
                    step="1"
                    value={customSplits[id] ?? ''}
                    onChange={(e) => handleCustomSplitChange(id, e.target.value)}
                    placeholder="0"
                  />
                </div>
              );
            })}
            <div
              className={`expense-form__custom-total ${customMismatch ? 'expense-form__custom-total--mismatch' : 'expense-form__custom-total--ok'}`}
            >
              합계: {formatCurrency(customTotal)}
              {isValidTotal && ` / 총액: ${formatCurrency(parsedTotal)}`}
            </div>
            {errors.customSplits && (
              <span className="expense-form__error">{errors.customSplits}</span>
            )}
          </div>
        )}

        <div className="expense-form__actions">
          <Button variant="outlined" type="button" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" loading={isSubmitting}>
            저장
          </Button>
        </div>
      </form>
    </>
  );
}
