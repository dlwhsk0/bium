import type { CSSProperties } from 'react'
import type { Toss } from '../lib/bium'
import { labelOf, type Category } from '../lib/categories'
import { iconFor, seeded } from '../lib/packs'
import { Emoji } from './Emoji'
import { ROW_H, slot } from '../lib/pile'
import { useLongPress } from '../lib/useLongPress'

/** 더미로 보여주는 최대 개수. 넘으면 개수만 오르고, 새로 넣은 건 더미 꼭대기에서 사라진다. */
const MAX_PILE = 25

interface Props {
  category: Category
  /** 이 카테고리의 버리기 기록, 오래된 순 */
  tosses: Toss[]
  /** 이 시각 이후에 버린 것만 떨어지는 애니메이션을 한다 (처음 열 때 다 떨어지지 않게) */
  animateAfter?: number
  onToss: () => void
  /** 꾹 누르면 이 카테고리 편집. 없으면 꾹 눌러도 그냥 넣기. */
  onEdit?: () => void
}

export function Bin({ category, tosses, animateAfter = Infinity, onToss, onEdit }: Props) {
  const label = labelOf(category)
  const press = useLongPress(onToss, onEdit ?? onToss)
  const pile = tosses.slice(0, MAX_PILE)
  const last = tosses.at(-1)
  const overflowDrop = last && tosses.length > MAX_PILE && last.at > animateAfter ? last : null
  // 숫자가 바뀔 때마다 key가 바뀌어 톡 튀는 애니메이션을 다시 재생한다
  const countKey = last && last.at > animateAfter ? last.at : 0

  return (
    <button
      className="bin"
      {...press}
      aria-label={`${label}에 넣기, 지금 ${tosses.length}개${onEdit ? '. 꾹 누르면 편집' : ''}`}
    >
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
            <Emoji
              key={t.at}
              name={iconFor(category.pack, t.at)}
              className={t.at > animateAfter ? 'item falling' : 'item'}
              style={style}
            />
          )
        })}
        {overflowDrop && (
          <Emoji
            key={overflowDrop.at}
            name={iconFor(category.pack, overflowDrop.at)}
            className="item vanishing"
            style={{ left: '50%', bottom: `${slot(MAX_PILE - 1).row * ROW_H}px` }}
          />
        )}
      </span>
    </button>
  )
}
