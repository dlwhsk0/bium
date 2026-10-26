import type { Bium, Toss } from './bium'
import { DEFAULT_CATEGORIES, readCategory, type Category } from './categories'
import { dayKey } from './date'

/**
 * 백업 파일 형식. 형식이 바뀌면 version을 올리고 parseBackup에서 옛 버전도 받아준다.
 * v1: categories 없음(기본 4개 고정) / v2: 사용자 카테고리 포함
 */
interface Backup {
  app: 'bium'
  version: 2
  exportedAt: number
  categories: Category[]
  active: Bium | null
  history: Bium[]
}

export interface BackupData {
  categories: Category[]
  active: Bium | null
  history: Bium[]
}

export function makeBackup({ categories, active, history }: BackupData, now = Date.now()): string {
  const backup: Backup = { app: 'bium', version: 2, exportedAt: now, categories, active, history }
  return JSON.stringify(backup)
}

/**
 * 백업 파일을 기기에 남긴다. 파일 이름에 날짜를 넣어 여러 번 백업해도 구분되게.
 * 폰에서는 공유 시트("파일에 저장", 메신저로 보내기)를 연다 — iOS 홈 화면 앱은 다운로드가 잘 안 되기 때문.
 * 그 밖에는 일반 다운로드. 공유 시트를 닫으면 'cancelled'.
 */
export async function saveBackupFile(json: string, now = Date.now()): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const name = `bium-backup-${dayKey(now)}.json`
  const file = new File([json], name, { type: 'application/json' })

  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
      // 공유가 막히면 아래 다운로드로 넘어간다
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** 손상되거나 다른 앱 파일이면 null. 모르는 필드(옛 버전의 name 등)는 버린다. */
function readBium(v: unknown): Bium | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || !isNum(o.startedAt) || !Array.isArray(o.tosses)) return null
  if (o.endedAt !== undefined && !isNum(o.endedAt)) return null

  const tosses: Toss[] = []
  for (const t of o.tosses) {
    const r = t as Record<string, unknown>
    if (typeof t !== 'object' || t === null || typeof r.category !== 'string' || !isNum(r.at)) return null
    tosses.push({ category: r.category, at: r.at })
  }
  return { id: o.id, startedAt: o.startedAt, ...(isNum(o.endedAt) && { endedAt: o.endedAt }), tosses }
}

/** 문제가 있으면 화면에 그대로 보여줄 수 있는 문장으로 Error를 던진다. */
export function parseBackup(text: string): BackupData {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('백업 파일을 읽을 수 없어요. 비움에서 저장한 .json 파일인지 확인해 주세요.')
  }
  const o = data as Record<string, unknown>
  if (typeof data !== 'object' || data === null || o.app !== 'bium' || !Array.isArray(o.history)) {
    throw new Error('비움 백업 파일이 아니에요.')
  }

  const history = o.history.map(readBium)
  const active = o.active == null ? null : readBium(o.active)
  // v1 파일은 카테고리가 없다 — 그때는 기본 4개였다
  const categories = Array.isArray(o.categories) ? o.categories.map(readCategory) : DEFAULT_CATEGORIES
  if (history.includes(null) || (o.active != null && active === null) || categories.includes(null)) {
    throw new Error('백업 파일 일부가 손상돼서 불러오지 않았어요.')
  }
  return { categories: categories as Category[], active, history: history as Bium[] }
}

/**
 * 지금 기록에 백업을 더한다. 이미 있는 비움(같은 id)은 건드리지 않으므로 몇 번을 불러와도 안전하다.
 * 진행 중인 비움은 지금 진행 중인 게 없을 때만 백업 것을 이어서 쓴다.
 */
export function mergeBackup(current: BackupData, backup: BackupData) {
  const known = new Set(current.history.map((b) => b.id))
  if (current.active) known.add(current.active.id)

  const added = backup.history.filter((b) => !known.has(b.id))
  const history = [...current.history, ...added].sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))

  const restoreActive = !current.active && backup.active !== null && !known.has(backup.active.id)
  // 아직 기록이 하나도 없는 기기(새 폰 등)면 백업의 카테고리 구성을 그대로 가져온다.
  // 쓰던 기기면 지금 칸 구성은 그대로 두고, 백업에만 있는 카테고리는 숨긴 채 더한다(지난 기록 표시용).
  const fresh = !current.active && current.history.length === 0
  const knownCategories = new Set(current.categories.map((c) => c.id))
  const categories = fresh
    ? backup.categories
    : [
        ...current.categories,
        ...backup.categories.filter((c) => !knownCategories.has(c.id)).map((c) => ({ ...c, hidden: true })),
      ]

  return {
    categories,
    active: restoreActive ? backup.active : current.active,
    history,
    addedCount: added.length + (restoreActive ? 1 : 0),
  }
}
