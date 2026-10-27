import { periodLabel, summarize, type Bium } from '../lib/bium'
import { categoryOf, labelOf, type Category } from '../lib/categories'
import { coverOf } from '../lib/packs'
import { Emoji } from '../components/Emoji'
import { formatDayKey } from '../lib/date'
import { useTwoStep } from '../lib/useTwoStep'

interface Props {
  bium: Bium
  categories: Category[]
  onClose: () => void
  onDelete: () => void
}

export function Result({ bium, categories, onClose, onDelete }: Props) {
  const s = summarize(bium)
  // 이 비움에서 실제로 버린 카테고리만, 카테고리 순서대로. 나중에 추가한 카테고리가 0개로 끼지 않게.
  const order = new Map(categories.map((c, i) => [c.id, i]))
  const shown = Object.keys(s.byCategory)
    .map((id) => categoryOf(categories, id))
    .sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity))
  const deleteButton = useTwoStep(onDelete)

  return (
    <main className="screen result">
      <div className="scroll-area">
        <header className="summary">
          <Emoji name="party" className="intro-icon" />
          <p className="caption">{periodLabel(bium)}</p>
          <p className="big-number">
            {s.total}
            <span className="unit">개 비웠어요</span>
          </p>
          <p className="body">{s.days}일 동안 방에서 내보냈어요</p>
        </header>

        {shown.length > 0 && (
          <section className="card tiles">
            {shown.map((c) => (
              <div key={c.id} className="tile">
                <Emoji name={coverOf(c.pack)} className="tile-icon" />
                <span className="tile-label">{labelOf(c)}</span>
                <span className="tile-count">{s.byCategory[c.id] ?? 0}개</span>
              </div>
            ))}
          </section>
        )}

        {s.bestDay && (
          <section className="card best">
            <span className="caption">가장 많이 치운 날</span>
            <span className="best-day">{formatDayKey(s.bestDay.day)}</span>
            <span className="body">이날 {s.bestDay.count}개를 비웠어요</span>
          </section>
        )}
      </div>

      <footer className="actions">
        <button
          className={deleteButton.confirming ? 'text-button danger' : 'text-button'}
          onClick={deleteButton.press}
        >
          {deleteButton.confirming ? '한 번 더 누르면 기록이 지워져요' : '이 기록 지우기'}
        </button>
        <button className="cta" onClick={onClose}>처음으로</button>
      </footer>
    </main>
  )
}
