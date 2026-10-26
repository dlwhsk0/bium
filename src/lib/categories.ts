// 아이콘: Microsoft Fluent Emoji 3D (MIT) — public/icons/<slug>.png
export const CATEGORIES = [
  {
    key: 'clothes',
    label: '의류',
    icons: ['tshirt', 'jeans', 'socks', 'coat', 'dress', 'cap', 'shoe', 'scarf'],
  },
  {
    key: 'goods',
    label: '소품',
    icons: ['teddy', 'frame', 'candle', 'package', 'plant', 'books', 'clock', 'puzzle'],
  },
  {
    key: 'cosmetics',
    label: '화장품',
    icons: ['lipstick', 'lotion', 'nailpolish', 'mirror', 'soap', 'toothbrush', 'bubbles', 'sponge'],
  },
  {
    key: 'trash',
    label: '쓰레기',
    icons: ['cup', 'newspaper', 'banana', 'tissue', 'can', 'bottle', 'juicebox', 'paper'],
  },
] as const

export type CategoryKey = (typeof CATEGORIES)[number]['key']

/** 0 이상 1 미만의 결정적 난수. 같은 seed면 늘 같은 값이라 새로고침해도 더미 모양이 그대로다. */
export function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** 버린 시각으로 아이콘을 고른다 — 저장하지 않아도 매번 같은 아이콘 */
export function iconFor(key: CategoryKey, at: number): string {
  const { icons } = CATEGORIES.find((c) => c.key === key)!
  return `/icons/${icons[Math.floor(seeded(at) * icons.length)]}.png`
}

export function emptyCounts(): Record<CategoryKey, number> {
  return { clothes: 0, goods: 0, cosmetics: 0, trash: 0 }
}
