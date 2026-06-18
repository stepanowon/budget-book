export interface SplitResult {
  userId: string;
  amount: number;
}

/**
 * 균등 분배 계산 (AC-ES1, BR-05, BR-06)
 * 나머지 금액은 결제자(paidBy)에게 귀속된다.
 */
export function calculateEqualSplit(
  totalAmount: number,
  participantIds: string[],
  paidBy: string,
): SplitResult[] {
  // paid_by가 participants에 없으면 추가 (BR-06)
  const allParticipants = participantIds.includes(paidBy)
    ? [...participantIds]
    : [paidBy, ...participantIds];

  const count = allParticipants.length;
  const baseAmount = Math.floor(totalAmount / count);
  const remainder = totalAmount - baseAmount * count;

  return allParticipants.map((userId) => ({
    userId,
    amount: userId === paidBy ? baseAmount + remainder : baseAmount,
  }));
}

/**
 * 개별 입력 분담 검증 (DR-04)
 */
export function validateCustomSplit(
  totalAmount: number,
  splits: { userId: string; amount: number }[],
  paidBy: string,
): { isValid: boolean; splits: SplitResult[] } {
  // paid_by가 splits에 없으면 자동 추가 (BR-06) — amount 0으로 추가 후 합산 검증
  const hasPaidBy = splits.some((s) => s.userId === paidBy);
  const allSplits = hasPaidBy ? splits : [...splits, { userId: paidBy, amount: 0 }];

  const sum = allSplits.reduce((acc, s) => acc + s.amount, 0);

  return {
    isValid: sum === totalAmount,
    splits: allSplits.map((s) => ({ userId: s.userId, amount: s.amount })),
  };
}
