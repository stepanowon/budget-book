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

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/**
 * username 유효성 검사 (서버 규칙과 동일: 3~20자, 영문 소문자·숫자·밑줄만)
 * @returns 오류 메시지. 유효하면 null
 */
export function getUsernameError(username: string): string | null {
  if (!username) return '사용자 이름을 입력해 주세요';
  if (username.length < USERNAME_MIN_LENGTH) {
    return `사용자 이름은 ${USERNAME_MIN_LENGTH}자 이상이어야 합니다`;
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return `사용자 이름은 ${USERNAME_MAX_LENGTH}자 이하여야 합니다`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return '영문 소문자, 숫자, 밑줄(_)만 사용할 수 있습니다';
  }
  return null;
}
