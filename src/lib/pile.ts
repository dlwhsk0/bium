export const ROW_H = 24

/**
 * 벽돌 쌓기 배치: 짝수 줄 4칸, 홀수 줄은 사이사이 3칸.
 * x는 더미 영역 너비 기준 %, row는 아래에서부터 줄 번호.
 */
export function slot(i: number) {
  const pair = Math.floor(i / 7)
  const r = i % 7
  const odd = r >= 4
  const row = pair * 2 + (odd ? 1 : 0)
  const col = odd ? r - 4 : r
  const x = odd ? 25 + col * 25 : 12.5 + col * 25
  return { x, row }
}
