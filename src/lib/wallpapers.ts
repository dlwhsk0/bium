/** 홈 화면 배경화면. 라이트와 다크에서 각각 쓸 배경. */
export const WALLPAPERS = [
  {
    id: 'lavender',
    name: '라벤더',
    light: 'linear-gradient(170deg, #9bb5f6 0%, #c3b4ee 55%, #efc4d6 100%)',
    dark: 'linear-gradient(170deg, #1d2645 0%, #34295a 60%, #4a2c47 100%)',
  },
  {
    id: 'mint',
    name: '민트',
    light: 'linear-gradient(180deg, #a9d3bc 0%, #6fa98b 100%)',
    dark: 'linear-gradient(180deg, #1c2a24 0%, #2d4639 100%)',
  },
  {
    id: 'sky',
    name: '하늘',
    light: 'linear-gradient(180deg, #8fb8f8 0%, #b9e0f7 100%)',
    dark: 'linear-gradient(180deg, #14233d 0%, #1e3a52 100%)',
  },
  {
    id: 'peach',
    name: '복숭아',
    light: 'linear-gradient(170deg, #ffc2a8 0%, #f59a9f 100%)',
    dark: 'linear-gradient(170deg, #3b2420 0%, #5a2f35 100%)',
  },
  {
    id: 'lemon',
    name: '레몬',
    light: 'linear-gradient(170deg, #f7d96b 0%, #f0b84a 100%)',
    dark: 'linear-gradient(170deg, #3a3218 0%, #4d3b12 100%)',
  },
  {
    id: 'forest',
    name: '숲',
    light: 'linear-gradient(180deg, #4f8a6b 0%, #2c5a45 100%)',
    dark: 'linear-gradient(180deg, #13261d 0%, #0b1712 100%)',
  },
  {
    id: 'sunset',
    name: '노을',
    light: 'linear-gradient(170deg, #f8b26a 0%, #e0708b 55%, #8a6bd1 100%)',
    dark: 'linear-gradient(170deg, #4a2a1e 0%, #45203a 55%, #261d45 100%)',
  },
  {
    id: 'fog',
    name: '안개',
    light: 'linear-gradient(180deg, #c9ced6 0%, #9aa3b0 100%)',
    dark: 'linear-gradient(180deg, #2a2e35 0%, #1b1e23 100%)',
  },
  {
    id: 'graphite',
    name: '그래파이트',
    light: 'linear-gradient(180deg, #5b6170 0%, #2f333b 100%)',
    dark: 'linear-gradient(180deg, #1a1c20 0%, #0e0f12 100%)',
  },
] as const

export type WallpaperId = (typeof WALLPAPERS)[number]['id'] | 'photo'

export const isWallpaperId = (v: unknown): v is WallpaperId =>
  v === 'photo' || WALLPAPERS.some((w) => w.id === v)

/** 배경화면을 CSS background 값으로. 사진은 다크일 때 살짝 어둡게 덮는다. */
export function wallpaperCss(id: WallpaperId, photo: string | null, dark: boolean): string {
  if (id === 'photo' && photo) {
    const veil = dark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.08)'
    return `linear-gradient(${veil}, ${veil}), center / cover no-repeat url("${photo}")`
  }
  const w = WALLPAPERS.find((p) => p.id === id) ?? WALLPAPERS[0]
  return dark ? w.dark : w.light
}
