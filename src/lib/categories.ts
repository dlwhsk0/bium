export const CATEGORIES = [
  { key: 'clothes', label: '의류', icon: '👕', emojis: ['👕', '👖', '🧦', '🧥', '👗', '🧢', '👟', '🧣'] },
  { key: 'goods', label: '소품', icon: '🧸', emojis: ['🧸', '🖼️', '🕯️', '📦', '🪴', '📚', '🎀', '🧩'] },
  { key: 'cosmetics', label: '화장품', icon: '💄', emojis: ['💄', '🧴', '💅', '🪞', '🧼', '🪥', '💋', '🫧'] },
  { key: 'trash', label: '쓰레기', icon: '🥤', emojis: ['🥤', '📰', '🍌', '🧻', '🥫', '🍾', '🧃', '🗞️'] },
] as const

export type CategoryKey = (typeof CATEGORIES)[number]['key']

export function emptyCounts(): Record<CategoryKey, number> {
  return { clothes: 0, goods: 0, cosmetics: 0, trash: 0 }
}
