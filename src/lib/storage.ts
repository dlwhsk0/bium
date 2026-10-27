import type { Bium } from './bium'
import { detectedPlatform, type Platform } from './platform'
import { isWallpaperId, type WallpaperId } from './wallpapers'
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

const SETTINGS_KEY = 'bium:settings'
const WALLPAPER_PHOTO_KEY = 'bium:wallpaper-photo'

/** 설정 앱: 화면 모양, 테마, 배경화면, 시계, 위젯, 진동 */
export type ThemeMode = 'system' | 'light' | 'dark'
export interface Settings {
  platform: Platform
  theme: ThemeMode
  wallpaper: WallpaperId
  /** 24시간제(끄면 오전/오후 12시간제) */
  clock24: boolean
  /** 홈 화면 비움 위젯 보이기 */
  widget: boolean
  /** 비움 위젯 크기: 크게(칸마다 큰 아이콘과 숫자) / 작게(한 줄) */
  widgetSize: 'large' | 'small'
  /** 앱 안의 진동 */
  haptics: boolean
}

const defaultSettings = (): Settings => ({
  platform: detectedPlatform,
  theme: 'system',
  wallpaper: detectedPlatform === 'android' ? 'mint' : 'lavender',
  clock24: true,
  widget: true,
  widgetSize: 'large',
  haptics: true,
})
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback)

export function loadSettings(): Settings {
  const raw = read<Partial<Settings> | null>(SETTINGS_KEY, null)
  const d = defaultSettings()
  return {
    platform: raw?.platform === 'ios' || raw?.platform === 'android' ? raw.platform : d.platform,
    theme: raw?.theme === 'light' || raw?.theme === 'dark' || raw?.theme === 'system' ? raw.theme : d.theme,
    wallpaper: isWallpaperId(raw?.wallpaper) ? raw.wallpaper : d.wallpaper,
    clock24: bool(raw?.clock24, d.clock24),
    widget: bool(raw?.widget, d.widget),
    widgetSize: raw?.widgetSize === 'small' || raw?.widgetSize === 'large' ? raw.widgetSize : d.widgetSize,
    haptics: bool(raw?.haptics, d.haptics),
  }
}
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s)

/** 배경화면으로 고른 사진(작게 줄인 JPEG data URL). 설정과 따로 둬서 설정 읽기가 가볍게. */
export const loadWallpaperPhoto = () => {
  const v = read<string | null>(WALLPAPER_PHOTO_KEY, null)
  return typeof v === 'string' && v.startsWith('data:image/') ? v : null
}
export const saveWallpaperPhoto = (data: string | null) => write(WALLPAPER_PHOTO_KEY, data)
