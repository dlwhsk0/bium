import { periodLabel, summarize, type Bium } from '../lib/bium'
import { CATEGORIES } from '../lib/categories'
import { formatDayKey } from '../lib/date'
import { useTwoStep } from '../lib/useTwoStep'
import { Bin } from '../components/Bin'

interface Props {
  bium: Bium
  onClose: () => void
  onDelete: () => void
}

export function Result({ bium, onClose, onDelete }: Props) {
  const s = summarize(bium)
  const deleteButton = useTwoStep(onDelete)

  return (
    <main className="screen result">
      <header className="tally">
        <p className="period">{periodLabel(bium)}</p>
        <p className="tally-total">{s.total}</p>
        <p className="tally-unit">개 비웠어요</p>
      </header>

      <section className="yard">
        {CATEGORIES.map((c) => (
          <Bin key={c.key} category={c.key} tosses={bium.tosses.filter((t) => t.category === c.key)} />
        ))}
      </section>

      {s.bestDay && (
        <p className="best">
          가장 많이 치운 날
          <strong>{formatDayKey(s.bestDay.day)} · {s.bestDay.count}개</strong>
        </p>
      )}

      <div className="result-actions">
        <button className="primary" onClick={onClose}>처음으로</button>
        <button className={deleteButton.confirming ? 'ghost danger' : 'ghost'} onClick={deleteButton.press}>
          {deleteButton.confirming ? '한 번 더 누르면 기록이 지워져요' : '이 기록 지우기'}
        </button>
      </div>
    </main>
  )
}
