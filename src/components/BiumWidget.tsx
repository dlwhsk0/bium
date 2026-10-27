import { useState } from 'react'
import type { Bium } from '../lib/bium'
import { labelOf, visibleCategories, type Category } from '../lib/categories'
import { getPack, iconUrl } from '../lib/packs'

interface Props {
  active: Bium | null
  categories: Category[]
  /** 칸을 누르면 그 카테고리에 하나 넣는다(비우는 중이 아니면 새로 시작) */
  onToss: (categoryId: string) => void
}

/** 홈 화면 앱 목록 바로 아래 비움 위젯(홈 화면 꾸미기): 앱을 열지 않고 카테고리 칸을 바로 눌러 넣는다 */
export function BiumWidget({ active, categories, onToss }: Props) {
  const visible = visibleCategories(categories)
  // 누른 칸만 아이콘이 톡 튀게: 누를 때마다 key를 바꿔 애니메이션을 다시 재생
  const [hop, setHop] = useState<{ id: string; n: number } | null>(null)
  const count = (id: string) => active?.tosses.filter((t) => t.category === id).length ?? 0
  // 4개 이하는 2칸씩, 그보다 많으면 3칸씩
  const cols = visible.length === 3 || visible.length > 4 ? 3 : 2

  return (
    <section className="bium-widget" aria-label="비움 위젯">
      <header className="bium-widget-head">
        <span className="bium-widget-title">비움</span>
        <span className="bium-widget-sub">{active ? `${active.tosses.length}개째 비우는 중` : '누르면 비움이 시작돼요'}</span>
      </header>
      <div className="bium-widget-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {visible.map((c) => (
          <button
            key={c.id}
            className="bium-widget-cell"
            onClick={() => {
              onToss(c.id)
              setHop((h) => ({ id: c.id, n: (h?.n ?? 0) + 1 }))
              navigator.vibrate?.(12)
            }}
            aria-label={`${labelOf(c)}에 넣기, 지금 ${count(c.id)}개`}
          >
            <img
              key={hop?.id === c.id ? hop.n : 0}
              className={hop?.id === c.id ? 'hop' : ''}
              src={iconUrl(getPack(c.pack).icons[0])}
              alt=""
              draggable={false}
            />
            <span className="bium-widget-label">{labelOf(c)}</span>
            <span className="bium-widget-count">{count(c.id)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
