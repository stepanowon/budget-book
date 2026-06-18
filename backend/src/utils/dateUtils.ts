/**
 * KST 날짜 문자열(YYYY-MM-DD)을 period_start UTC ISO 문자열로 변환
 * period_start: 해당 날짜 00:00:00 KST = 전날 15:00:00 UTC
 */
export function kstDateToPeriodStartUtc(kstDate: string): string {
  // KST는 UTC+9이므로, 00:00:00 KST = 전날 15:00:00 UTC
  const [year, month, day] = kstDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - 9 * 60 * 60 * 1000);
  return utc.toISOString();
}

/**
 * KST 날짜 문자열(YYYY-MM-DD)을 period_end UTC ISO 문자열로 변환
 * period_end: 해당 날짜 23:59:59.999 KST = 해당 날짜 14:59:59.999 UTC
 */
export function kstDateToPeriodEndUtc(kstDate: string): string {
  const [year, month, day] = kstDate.split('-').map(Number);
  const utc = new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 9 * 60 * 60 * 1000,
  );
  return utc.toISOString();
}

/**
 * UTC ISO 문자열을 KST 날짜 문자열(YYYY-MM-DD)로 변환
 */
export function utcToKstDate(utcIso: string): string {
  const utc = new Date(utcIso);
  const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}
