export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: '로그인이 필요합니다.',
  INSUFFICIENT_ROLE: '권한이 없습니다.',
  RESOURCE_NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  DUPLICATE_RESOURCE: '이미 존재하는 항목입니다.',
  VALIDATION_FAILED: '입력 값을 확인해 주세요.',
  INTERNAL_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해 주세요.',
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? '오류가 발생했습니다.';
}
