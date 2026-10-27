import { useState } from 'react'
import type { Bium } from '../lib/bium'
import { labelOf, visibleCategories, type Category } from '../lib/categories'
import { coverUrl } from '../lib/packs'
import { useLongPress } from '../lib/useLongPress'
import { buzz } from '../lib/haptics'

interface Props {
  active: Bium | null
  categories: Category[]
  size: 'large' | 'small'
  /** 칸을 누르면 그 카테고리에 하나 넣는다(비우는 중이 아니면 새로 시작) */
  onToss: (categoryId: string) => void
  /** 위젯을 꾹 누르면 위젯 설정(크기, 제거) */
  onSettings: () => void
}

/** 칸 하나: 짧게 누르면 넣기, 꾹 누르면 위젯 설정 */
function Cell(props: { label: string; cover: string; count: number; hop: number | null; onToss: () => void; onSettings: () => void }) {
  const press = useLongPress(props.onToss, props.onSettings)
  return (
    <button className="bium-widget-cell" {...press} aria-label={`${props.label}에 넣기, 지금 ${props.count}개. 꾹 누르면 위젯 설정`}>
      <img key={props.hop ?? 0} className={props.hop !== null ? 'hop' : ''} src={props.cover} alt="" draggable={false} />
      <span className="bium-widget-label">{props.label}</span>
      <span className="bium-widget-count">{props.count}</span>
    </button>
  )
}

/** 홈 화면 앱 목록 바로 아래 비움 위젯(홈 화면 꾸미기): 앱을 열지 않고 카테고리 칸을 바로 눌러 넣는다 */
export function BiumWidget({ active, categories, size, onToss, onSettings }: Props) {
  const visible = visibleCategories(categories)
  // 누른 칸만 아이콘이 톡 튀게: 누를 때마다 key를 바꿔 애니메이션을 다시 재생
  const [hop, setHop] = useState<{ id: string; n: number } | null>(null)
  const count = (id: string) => active?.tosses.filter((t) => t.category === id).length ?? 0
  // 크게: 4개 이하는 2칸씩, 그보다 많으면 3칸씩 / 작게: 3칸씩 한 줄 셀
  const cols = size === 'small' || visible.length === 3 || visible.length > 4 ? 3 : 2
  const headPress = useLongPress(() => {}, onSettings)

  return (
    <section className={`bium-widget ${size}`} aria-label="비움 위젯">
      <header className="bium-widget-head" {...headPress}>
        <span className="bium-widget-title">비움</span>
        <span className="bium-widget-sub">{active ? `${active.tosses.length}개째 비우는 중` : '누르면 비움이 시작돼요'}</span>
      </header>
      <div className="bium-widget-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {visible.map((c) => (
          <Cell
            key={c.id}
            label={labelOf(c)}
            cover={coverUrl(c.pack)}
            count={count(c.id)}
            hop={hop?.id === c.id ? hop.n : null}
            onToss={() => {
              onToss(c.id)
              setHop((h) => ({ id: c.id, n: (h?.n ?? 0) + 1 }))
              buzz(12)
            }}
            onSettings={onSettings}
          />
        ))}
      </div>
    </section>
  )
}
