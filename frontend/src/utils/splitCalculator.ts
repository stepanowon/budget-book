/**
 * 균등 분배 계산: 나머지 금액은 결제자(paidByUserId)에게 귀속한다.
 * @returns 각 참여자 user_id → 분담 금액 매핑
 * @example calculateEqualSplit(10, ['a','b','c'], 'a') → { a:4, b:3, c:3 }
 */
export function calculateEqualSplit(
  totalAmount: number,
  participantIds: string[],
  paidByUserId: string,
): Record<string, number> {
  const count = participantIds.length;
  if (count === 0) return {};

  const base = Math.floor(totalAmount / count);
  const remainder = totalAmount - base * count;

  const result: Record<string, number> = {};
  for (const id of participantIds) {
    result[id] = base;
  }

  // 나머지는 결제자에게 귀속
  if (remainder > 0 && paidByUserId in result) {
    result[paidByUserId] += remainder;
  }

  return result;
}
