import { dayKey, daysInclusive, formatKoreanMD } from './date'

/** 버리기 1회. 날짜별 집계·되돌리기 모두 이 목록에서 계산한다. */
export interface Toss {
  /** Category.id */
  category: string
  at: number
}

/** 며칠에 걸치는 비움 한 번 */
export interface Bium {
  id: string
  startedAt: number
  endedAt?: number
  tosses: Toss[]
}

export interface BiumStats {
  total: number
  /** 카테고리 id → 개수. 하나도 안 버린 카테고리는 없을 수 있다. */
  byCategory: Record<string, number>
  days: number
  /** 가장 많이 치운 날. 동점이면 먼저 온 날. */
  bestDay: { day: string; count: number } | null
}

// crypto.randomUUID는 보안 컨텍스트(https)에서만 있어서 폰으로 LAN 접속하는 개발 환경에선 못 쓴다
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export function startBium(now = Date.now()): Bium {
  return { id: newId(), startedAt: now, tosses: [] }
}

export function toss(b: Bium, category: string, now = Date.now()): Bium {
  return { ...b, tosses: [...b.tosses, { category, at: now }] }
}

export function undo(b: Bium): Bium {
  return { ...b, tosses: b.tosses.slice(0, -1) }
}

export function finish(b: Bium, now = Date.now()): Bium {
  return { ...b, endedAt: now }
}

export function summarize(b: Bium, now = Date.now()): BiumStats {
  const byCategory: Record<string, number> = {}
  const perDay = new Map<string, number>()
  for (const t of b.tosses) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1
    const key = dayKey(t.at)
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
  }

  let bestDay: BiumStats['bestDay'] = null
  for (const [day, count] of perDay) {
    if (!bestDay || count > bestDay.count) bestDay = { day, count }
  }

  return {
    total: b.tosses.length,
    byCategory,
    days: daysInclusive(b.startedAt, b.endedAt ?? now),
    bestDay,
  }
}

/** 진행 중: `4일째 비우는 중` / 끝남: `10월 23일부터 10월 26일까지` (하루면 `10월 26일`) */
export function periodLabel(b: Bium, now = Date.now()): string {
  if (b.endedAt === undefined) return `${daysInclusive(b.startedAt, now)}일째 비우는 중`
  if (daysInclusive(b.startedAt, b.endedAt) === 1) return formatKoreanMD(b.startedAt)
  return `${formatKoreanMD(b.startedAt)}부터 ${formatKoreanMD(b.endedAt)}까지`
}
