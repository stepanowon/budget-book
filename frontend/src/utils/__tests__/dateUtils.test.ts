import { describe, it, expect } from 'vitest';
import { toApiDateString, formatDisplayDate, formatDisplayDateTime } from '../dateUtils';

describe('toApiDateString', () => {
  it('UTC 날짜를 KST YYYY-MM-DD로 변환한다', () => {
    // UTC 2026-07-01T00:00:00Z → KST 2026-07-01T09:00:00 → '2026-07-01'
    const date = new Date('2026-07-01T00:00:00Z');
    expect(toApiDateString(date)).toBe('2026-07-01');
  });

  it('UTC 자정 전날 KST는 다음날이 된다', () => {
    // UTC 2026-06-30T15:00:00Z → KST 2026-07-01T00:00:00
    const date = new Date('2026-06-30T15:00:00Z');
    expect(toApiDateString(date)).toBe('2026-07-01');
  });

  it('월/일 패딩이 올바르다', () => {
    const date = new Date('2026-01-05T00:00:00Z');
    expect(toApiDateString(date)).toBe('2026-01-05');
  });
});

describe('formatDisplayDate', () => {
  it('YYYY-MM-DD를 YYYY년 MM월 DD일로 변환한다', () => {
    expect(formatDisplayDate('2026-07-01')).toBe('2026년 07월 01일');
  });

  it('2자리 월/일이 그대로 유지된다', () => {
    expect(formatDisplayDate('2026-12-31')).toBe('2026년 12월 31일');
  });
});

describe('formatDisplayDateTime', () => {
  it('ISO 8601 문자열을 YYYY-MM-DD HH:mm으로 변환한다', () => {
    // 로컬 타임존에 따라 결과가 달라지므로 형식만 검사
    const result = formatDisplayDateTime('2026-07-01T12:30:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('분이 00일 때 올바르게 표시된다', () => {
    const result = formatDisplayDateTime('2026-07-01T00:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:00$/);
  });
});
