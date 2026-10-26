import { getPack, isPackKey, type PackKey } from './packs'

/**
 * 버릴 물건을 나누는 칸. 사용자가 이름과 아이템팩을 바꾸고 추가·삭제할 수 있다.
 * 삭제하면 지우지 않고 hidden으로 숨긴다 — 그 카테고리로 버린 기록이 지난 비움에 남아 있기 때문.
 */
export interface Category {
  id: string
  label: string
  pack: PackKey
  hidden?: boolean
}

export const MIN_CATEGORIES = 2
export const MAX_CATEGORIES = 6
export const MAX_LABEL = 8

// 처음 기본값. id는 예전 버전의 고정 키와 같아서 옛 기록이 그대로 이어진다.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'clothes', label: '의류', pack: 'clothes' },
  { id: 'goods', label: '소품', pack: 'goods' },
  { id: 'cosmetics', label: '화장품', pack: 'cosmetics' },
  { id: 'trash', label: '쓰레기', pack: 'trash' },
]

export const visibleCategories = (list: Category[]) => list.filter((c) => !c.hidden)

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function addCategory(list: Category[], pack: PackKey): Category[] {
  return [...list, { id: newId(), label: getPack(pack).name, pack }]
}

export function updateCategory(list: Category[], id: string, patch: Partial<Pick<Category, 'label' | 'pack'>>) {
  return list.map((c) => (c.id === id ? { ...c, ...patch } : c))
}

export function hideCategory(list: Category[], id: string) {
  return list.map((c) => (c.id === id ? { ...c, hidden: true } : c))
}

/** 기록에 남은 id로 카테고리를 찾는다. 어떤 이유로 없으면 '기타'로 보여준다. */
export function categoryOf(list: Category[], id: string): Category {
  return list.find((c) => c.id === id) ?? { id, label: '기타', pack: 'goods', hidden: true }
}

/** 이름을 비워두면 아이템팩 이름으로 채운다 */
export const labelOf = (c: Category) => c.label.trim() || getPack(c.pack).name

/** 손상됐으면 null. 저장소와 백업 파일 둘 다 이걸로 읽는다. */
export function readCategory(v: unknown): Category | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.label !== 'string' || !isPackKey(o.pack)) return null
  return { id: o.id, label: o.label.slice(0, MAX_LABEL), pack: o.pack, ...(o.hidden === true && { hidden: true }) }
}
