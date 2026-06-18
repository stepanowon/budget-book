/**
 * 정수 KRW 금액을 한국어 표기로 변환한다.
 * @example formatCurrency(1000) === '1,000원'
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}
