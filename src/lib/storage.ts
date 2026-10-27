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

const MIND_COUNT_KEY = 'bium:mind-count'

/** 마음 비우기로 버린 종이 수. 적은 내용은 어디에도 저장하지 않고 개수만 센다. */
export const loadMindCount = () => read<number>(MIND_COUNT_KEY, 0)
export const saveMindCount = (n: number) => write(MIND_COUNT_KEY, n)

const BURST_COUNT_KEY = 'bium:burst-count'

/** Chat에서 터트린 방 수. 대화 내용은 저장하지 않는다. */
export const loadBurstCount = () => read<number>(BURST_COUNT_KEY, 0)
export const saveBurstCount = (n: number) => write(BURST_COUNT_KEY, n)

const FRIEND_KEY = 'bium:vent-friend'

/** Chat의 친구 프로필. photo는 작게 줄인 data URL(없으면 기본 그림). */
export interface Friend {
  name: string
  photo: string | null
}
export const DEFAULT_FRIEND: Friend = { name: '비움이', photo: null }

export function loadFriend(): Friend {
  const raw = read<Partial<Friend> | null>(FRIEND_KEY, null)
  return {
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name : DEFAULT_FRIEND.name,
    photo: typeof raw?.photo === 'string' && raw.photo.startsWith('data:image/') ? raw.photo : null,
  }
}
export const saveFriend = (f: Friend) => write(FRIEND_KEY, f)

const VENT_CHAT_KEY = 'bium:vent-chat'

/** Chat 톡방 말풍선. read는 내 말풍선만(친구가 읽었는지). */
export interface VentMessage {
  id: number
  from: 'me' | 'friend'
  text: string
  at: number
  read?: boolean
}

/**
 * 나가기(방 터트리기) 전까지의 대화. 새로고침해도 이어지고, 방을 나가면 지운다.
 * 이 기기 안에만 있고 백업 파일에는 넣지 않는다.
 */
export interface VentChat {
  openedAt: number
  messages: VentMessage[]
}

export function loadVentChat(): VentChat | null {
  const raw = read<VentChat | null>(VENT_CHAT_KEY, null)
  if (!raw || typeof raw.openedAt !== 'number' || !Array.isArray(raw.messages)) return null
  const messages = raw.messages.filter(
    (m) => typeof m?.id === 'number' && (m.from === 'me' || m.from === 'friend') && typeof m.text === 'string' && typeof m.at === 'number',
  )
  return { openedAt: raw.openedAt, messages }
}
export const saveVentChat = (chat: VentChat | null) => write(VENT_CHAT_KEY, chat)
