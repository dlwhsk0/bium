import { emptyCounts, type CategoryKey } from './categories'
import { dayKey, daysInclusive, formatKoreanMD, formatMD } from './date'

/** 버리기 1회. 날짜별 집계·되돌리기 모두 이 목록에서 계산한다. */
export interface Toss {
  category: CategoryKey
  at: number
}

/** 며칠에 걸치는 비움 한 번 */
export interface Bium {
  id: string
  name: string
  startedAt: number
  endedAt?: number
  tosses: Toss[]
}

export interface BiumStats {
  total: number
  byCategory: Record<CategoryKey, number>
  days: number
  /** 가장 많이 치운 날. 동점이면 먼저 온 날. */
  bestDay: { day: string; count: number } | null
}

// crypto.randomUUID는 보안 컨텍스트(https)에서만 있어서 폰으로 LAN 접속하는 개발 환경에선 못 쓴다
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const defaultName = (t: number) => `${formatKoreanMD(t)} 비움`

export function startBium(name: string, now = Date.now()): Bium {
  return { id: newId(), name: name.trim() || defaultName(now), startedAt: now, tosses: [] }
}

export function toss(b: Bium, category: CategoryKey, now = Date.now()): Bium {
  return { ...b, tosses: [...b.tosses, { category, at: now }] }
}

export function undo(b: Bium): Bium {
  return { ...b, tosses: b.tosses.slice(0, -1) }
}

export function finish(b: Bium, now = Date.now()): Bium {
  return { ...b, endedAt: now }
}

export function summarize(b: Bium, now = Date.now()): BiumStats {
  const byCategory = emptyCounts()
  const perDay = new Map<string, number>()
  for (const t of b.tosses) {
    byCategory[t.category]++
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

/** 진행 중: `10/26 시작 · 4일째` / 끝남: `10/26 ~ 10/29 (4일)` */
export function periodLabel(b: Bium, now = Date.now()): string {
  const days = daysInclusive(b.startedAt, b.endedAt ?? now)
  if (b.endedAt === undefined) return `${formatMD(b.startedAt)} 시작 · ${days}일째`
  if (days === 1) return `${formatMD(b.startedAt)} (1일)`
  return `${formatMD(b.startedAt)} ~ ${formatMD(b.endedAt)} (${days}일)`
}
