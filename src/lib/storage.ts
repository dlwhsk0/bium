import type { Bium } from './bium'

const ACTIVE_KEY = 'bium:active'
const HISTORY_KEY = 'bium:history'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 사파리 개인정보 보호 모드 등에서 저장이 막혀도 앱은 계속 동작
  }
}

export const loadActive = () => read<Bium | null>(ACTIVE_KEY, null)
export const saveActive = (b: Bium | null) => write(ACTIVE_KEY, b)

/** 끝난 비움 목록, 최신순 */
export const loadHistory = () => read<Bium[]>(HISTORY_KEY, [])
export const saveHistory = (list: Bium[]) => write(HISTORY_KEY, list)

const ONBOARDED_KEY = 'bium:onboarded'

/** 처음 소개 화면을 이미 봤는지 */
export const loadOnboarded = () => read<boolean>(ONBOARDED_KEY, false)
export const saveOnboarded = () => write(ONBOARDED_KEY, true)
