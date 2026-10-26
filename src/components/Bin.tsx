import type { CSSProperties } from 'react'
import type { Toss } from '../lib/bium'
import { CATEGORIES, iconFor, seeded, type CategoryKey } from '../lib/categories'

/** 더미로 보여주는 최대 개수. 넘으면 개수만 오르고, 새로 넣은 건 더미 꼭대기에서 사라진다. */
const MAX_PILE = 25
const ROW_H = 24

/**
 * 벽돌 쌓기 배치: 짝수 줄 4칸, 홀수 줄은 사이사이 3칸.
 * x는 더미 영역 너비 기준 %, row는 아래에서부터 줄 번호.
 */
function slot(i: number) {
  const pair = Math.floor(i / 7)
  const r = i % 7
  const odd = r >= 4
  const row = pair * 2 + (odd ? 1 : 0)
  const col = odd ? r - 4 : r
  const x = odd ? 25 + col * 25 : 12.5 + col * 25
  return { x, row }
}

interface Props {
  category: CategoryKey
  /** 이 분류의 버리기 기록, 오래된 순 */
  tosses: Toss[]
  /** 이 시각 이후에 버린 것만 떨어지는 애니메이션을 한다 (처음 열 때 다 떨어지지 않게) */
  animateAfter?: number
  onToss: () => void
}

export function Bin({ category, tosses, animateAfter = Infinity, onToss }: Props) {
  const { label } = CATEGORIES.find((c) => c.key === category)!
  const pile = tosses.slice(0, MAX_PILE)
  const last = tosses.at(-1)
  const overflowDrop = last && tosses.length > MAX_PILE && last.at > animateAfter ? last : null
  // 숫자가 바뀔 때마다 key가 바뀌어 톡 튀는 애니메이션을 다시 재생한다
  const countKey = last && last.at > animateAfter ? last.at : 0

  return (
    <button className="bin" onClick={onToss} aria-label={`${label}에 넣기, 지금 ${tosses.length}개`}>
      <span className="bin-head">
        <span className="bin-label">{label}</span>
        <span key={countKey} className={countKey ? 'bin-count bump' : 'bin-count'}>
          {tosses.length}
        </span>
      </span>
      <span className="pile" aria-hidden>
        {pile.map((t, i) => {
          const { x, row } = slot(i)
          const style = {
            left: `${x + (seeded(t.at + 1) - 0.5) * 6}%`,
            bottom: `${row * ROW_H + seeded(t.at + 2) * 4}px`,
            '--r': `${(seeded(t.at + 3) - 0.5) * 50}deg`,
          } as CSSProperties
          return (
            <img
              key={t.at}
              className={t.at > animateAfter ? 'item falling' : 'item'}
              src={iconFor(category, t.at)}
              alt=""
              style={style}
              draggable={false}
            />
          )
        })}
        {overflowDrop && (
          <img
            key={overflowDrop.at}
            className="item vanishing"
            src={iconFor(category, overflowDrop.at)}
            alt=""
            style={{ left: '50%', bottom: `${slot(MAX_PILE - 1).row * ROW_H}px` }}
            draggable={false}
          />
        )}
      </span>
    </button>
  )
}
