const pad = (n: number) => String(n).padStart(2, '0')

/** 로컬 시간 기준 날짜 키 `YYYY-MM-DD` */
export function dayKey(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 시작일과 마지막 날을 모두 포함한 달력상 일수 (같은 날이면 1) */
export function daysInclusive(from: number, to: number): number {
  const a = new Date(from)
  const b = new Date(to)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  // 서머타임으로 하루가 23/25시간일 수 있어 반올림
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1
}

/** `10/26` */
export function formatMD(t: number): string {
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** `10월 26일` */
export function formatKoreanMD(t: number): string {
  const d = new Date(t)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** `2026-10-27` → `10/27` */
export function formatDayKey(key: string): string {
  const [, m, d] = key.split('-')
  return `${Number(m)}/${Number(d)}`
}
