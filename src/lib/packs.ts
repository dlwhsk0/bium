// 아이템팩: 카테고리 카드에 쌓이는 3D 아이콘 묶음. 첫 아이콘(또는 COVERS)이 팩의 대표 그림이라 팩끼리 겹치지 않게 둔다.
// 아이콘 이름은 lib/emoji.ts의 이모지 글자로 그린다(기기 이모지)
export const PACKS = [
  { key: 'clothes', name: '옷', icons: ['tshirt', 'jeans', 'socks', 'coat', 'dress', 'cap', 'shoe', 'scarf'] },
  { key: 'goods', name: '소품', icons: ['teddy', 'frame', 'candle', 'package', 'plant', 'books', 'clock', 'puzzle'] },
  {
    key: 'cosmetics',
    name: '화장품',
    icons: ['lipstick', 'lotion', 'nailpolish', 'mirror', 'soap', 'toothbrush', 'bubbles', 'sponge'],
  },
  { key: 'trash', name: '쓰레기', icons: ['cup', 'newspaper', 'banana', 'tissue', 'can', 'bottle', 'juicebox', 'paper'] },
  { key: 'paper', name: '종이와 책', icons: ['notebook', 'books', 'newspaper', 'envelope', 'openbook', 'memo', 'ledger', 'paper'] },
  { key: 'kitchen', name: '주방', icons: ['teapot', 'forkknife', 'bowl', 'hotdrink', 'cup', 'chopsticks', 'pan', 'milk'] },
  {
    key: 'electronics',
    name: '전자기기',
    icons: ['phone', 'battery', 'plug', 'headphone', 'mouse', 'keyboard', 'joystick', 'bulb'],
  },
  { key: 'toys', name: '장난감', icons: ['kite', 'ball', 'yoyo', 'teddy', 'die', 'puzzle', 'balloon', 'dolls'] },
  { key: 'shoesbags', name: '신발과 가방', icons: ['shoe', 'heels', 'boot', 'flatshoe', 'handbag', 'backpack', 'purse', 'clutch'] },
  {
    key: 'stationery',
    name: '문구',
    icons: ['pencil', 'pen', 'crayon', 'scissors', 'paperclip', 'ruler', 'pushpin', 'paintbrush'],
  },
  {
    key: 'accessories',
    name: '액세서리',
    icons: ['glasses', 'sunglasses', 'watch', 'ring', 'gem', 'necktie', 'cap', 'scarf'],
  },
] as const

export type PackKey = (typeof PACKS)[number]['key']

const byKey = new Map<string, (typeof PACKS)[number]>(PACKS.map((p) => [p.key, p]))

export const isPackKey = (v: unknown): v is PackKey => typeof v === 'string' && byKey.has(v)

export function getPack(key: PackKey) {
  return byKey.get(key)!
}

// 대표 그림을 첫 아이콘과 다르게 두고 싶은 팩. 팩 안 아이콘 순서를 바꾸면 이미 쌓인 더미 그림이 바뀌므로
// 대표만 따로 정한다.
const COVERS: Partial<Record<PackKey, string>> = { cosmetics: 'lotion' }

/** 팩의 대표 그림(카테고리 썸네일, 위젯, 통계 타일) */
export const coverOf = (key: PackKey): string => COVERS[key] ?? getPack(key).icons[0]

/** 팩 고르기에서 미리 보여줄 아이콘 3개(대표 그림이 맨 앞) */
export function previewIcons(key: PackKey): string[] {
  const cover = COVERS[key]
  const icons: readonly string[] = getPack(key).icons
  return (cover ? [cover, ...icons.filter((i) => i !== cover)] : [...icons]).slice(0, 3)
}

/** 0 이상 1 미만의 결정적 난수. 같은 seed면 늘 같은 값이라 새로고침해도 더미 모양이 그대로다. */
export function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** 버린 시각으로 팩 안의 아이콘 이름을 고른다 — 저장하지 않아도 매번 같은 아이콘 */
export function iconFor(pack: PackKey, at: number): string {
  const { icons } = getPack(pack)
  return icons[Math.floor(seeded(at) * icons.length)]
}
