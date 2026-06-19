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
  initialValues?: Partial<Omit<CreateExpenseRequest, 'custom_splits'> & { paid_by: string; custom_splits: Record<string, string> }>;
  onSubmit: (data: CreateExpenseRequest) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const inputClass =
  'px-3 py-2 border border-border rounded text-sm font-sans min-h-[44px] text-[#202124] bg-white w-full box-border outline-none focus:border-primary focus:ring-2 focus:ring-primary-light';
const labelClass = 'text-[13px] font-medium text-neutral';
const labelRequiredClass =
  'text-[13px] font-medium text-neutral after:content-["_*"] after:text-danger';

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
  const [date, setDate] = useState((initialValues?.date ?? today).slice(0, 10));
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
  const [customSplits, setCustomSplits] = useState<Record<string, string>>(
    initialValues?.custom_splits ?? {},
  );
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
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="ef-description">
          설명
        </label>
        <input
          id="ef-description"
          className={inputClass}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="예: 저녁 식사"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelRequiredClass} htmlFor="ef-amount">
          금액 (원)
        </label>
        <input
          id="ef-amount"
          className={inputClass}
          type="number"
          min="1"
          step="1"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder="0"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
        {errors.totalAmount && (
          <span className="text-xs text-danger">{errors.totalAmount}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelRequiredClass} htmlFor="ef-date">
          날짜
        </label>
        <input
          id="ef-date"
          className={inputClass}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {errors.date && (
          <span className="text-xs text-danger">{errors.date}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelRequiredClass} htmlFor="ef-category">
          카테고리
        </label>
        <select
          id="ef-category"
          className={inputClass}
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
          <span className="text-xs text-danger">{errors.categoryId}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>분담 방식</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
            <input
              type="radio"
              value={SPLIT_TYPE.EQUAL}
              checked={splitType === SPLIT_TYPE.EQUAL}
              onChange={() => setSplitType(SPLIT_TYPE.EQUAL)}
            />
            균등 분담
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
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

      <div className="flex flex-col gap-1">
        <span className={labelRequiredClass}>참여자</span>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <label key={m.user_id} className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
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
          <span className="text-xs text-danger">{errors.participants}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelRequiredClass} htmlFor="ef-paid-by">
          결제자
        </label>
        <select
          id="ef-paid-by"
          className={inputClass}
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
        <div className="bg-primary-light rounded px-4 py-3 text-[13px] text-primary">
          {(() => {
            const paidByMember = members.find((m) => m.user_id === paidBy);
            const paidByAmt = equalSplits[paidBy] ?? 0;
            const baseAmt = Object.values(equalSplits).find((v) => v !== paidByAmt) ?? paidByAmt;
            return `각자 ${formatCurrency(baseAmt)} (결제자 ${paidByMember?.username ?? ''} ${formatCurrency(paidByAmt)})`;
          })()}
        </div>
      )}

      {splitType === SPLIT_TYPE.CUSTOM && (
        <div className="flex flex-col gap-1">
          <span className={labelClass}>참여자별 금액</span>
          {participantIds.map((id) => {
            const member = members.find((m) => m.user_id === id);
            return (
              <div key={id} className="flex items-center gap-3 mb-2">
                <span className="flex-1 text-sm">{member?.username ?? id}</span>
                <input
                  className="w-[120px] px-2.5 py-1.5 border border-border rounded text-sm min-h-[44px] text-right [font-variant-numeric:tabular-nums] outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
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
            className={`text-[13px] font-medium mt-2 ${customMismatch ? 'text-danger' : 'text-success'}`}
          >
            합계: {formatCurrency(customTotal)}
            {isValidTotal && ` / 총액: ${formatCurrency(parsedTotal)}`}
          </div>
          {errors.customSplits && (
            <span className="text-xs text-danger">{errors.customSplits}</span>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outlined" type="button" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" loading={isSubmitting}>
          저장
        </Button>
      </div>
    </form>
  );
}
