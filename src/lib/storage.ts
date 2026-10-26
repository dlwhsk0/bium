import type { Bium } from './bium'
import { DEFAULT_CATEGORIES, MIN_CATEGORIES, readCategory, visibleCategories, type Category } from './categories'

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

const CATEGORIES_KEY = 'bium:categories'

/** 저장된 카테고리. 없거나 깨졌거나 보이는 게 너무 적으면 기본값. */
export function loadCategories(): Category[] {
  const raw = read<unknown>(CATEGORIES_KEY, null)
  if (!Array.isArray(raw)) return DEFAULT_CATEGORIES
  const list = raw.map(readCategory)
  if (list.includes(null)) return DEFAULT_CATEGORIES
  const ok = list as Category[]
  return visibleCategories(ok).length >= MIN_CATEGORIES ? ok : DEFAULT_CATEGORIES
}
export const saveCategories = (list: Category[]) => write(CATEGORIES_KEY, list)
