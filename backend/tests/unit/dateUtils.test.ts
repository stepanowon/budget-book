import { kstDateToPeriodStartUtc, kstDateToPeriodEndUtc, utcToKstDate } from '../../src/utils/dateUtils';

describe('KST-UTC 변환 유틸 (BE-09)', () => {
  it('KST 2026-06-15 → period_start UTC는 2026-06-14T15:00:00.000Z', () => {
    expect(kstDateToPeriodStartUtc('2026-06-15')).toBe('2026-06-14T15:00:00.000Z');
  });

  it('KST 2026-06-15 → period_end UTC는 2026-06-15T14:59:59.999Z', () => {
    expect(kstDateToPeriodEndUtc('2026-06-15')).toBe('2026-06-15T14:59:59.999Z');
  });

  it('KST 2026-01-01 → period_start UTC는 2025-12-31T15:00:00.000Z', () => {
    expect(kstDateToPeriodStartUtc('2026-01-01')).toBe('2025-12-31T15:00:00.000Z');
  });

  it('UTC ISO → KST 날짜 변환이 정확하다', () => {
    expect(utcToKstDate('2026-06-14T15:00:00.000Z')).toBe('2026-06-15');
  });
});
