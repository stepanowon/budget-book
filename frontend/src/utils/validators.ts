import { AMOUNT_MIN, AMOUNT_MAX } from '@/constants/expense';

/**
 * 금액 유효성 검사: 1 이상 999,999,999 이하 정수
 */
export function validateAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount >= AMOUNT_MIN && amount <= AMOUNT_MAX;
}

/**
 * 날짜 범위 유효성 검사: start <= end
 * @param start 'YYYY-MM-DD'
 * @param end   'YYYY-MM-DD'
 */
export function validateDateRange(start: string, end: string): boolean {
  return start <= end;
}
