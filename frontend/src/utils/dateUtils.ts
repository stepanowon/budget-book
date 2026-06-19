/**
 * Date 객체를 KST 기준 'YYYY-MM-DD' 문자열로 변환한다.
 */
export function toApiDateString(date: Date): string {
  // KST = UTC+9
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 'YYYY-MM-DD' 문자열을 'YYYY년 MM월 DD일' 형식으로 변환한다.
 */
export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.slice(0, 10).split('-');
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * ISO 8601 날짜시각 문자열을 'YYYY-MM-DD HH:mm' 형식으로 변환한다.
 */
export function formatDisplayDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
