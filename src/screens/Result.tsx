import { periodLabel, summarize, type Bium } from '../lib/bium'
import { CATEGORIES } from '../lib/categories'
import { formatDayKey } from '../lib/date'
import { useTwoStep } from '../lib/useTwoStep'

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
      <header className="summary">
        <img className="intro-icon" src="/icons/party.png" alt="" draggable={false} />
        <p className="caption">{periodLabel(bium)}</p>
        <p className="big-number">
          {s.total}
          <span className="unit">개 비웠어요</span>
        </p>
        <p className="body">{s.days}일 동안 방에서 내보냈어요</p>
      </header>

      <section className="card tiles">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="tile">
            <img src={`/icons/${c.icons[0]}.png`} alt="" draggable={false} />
            <span className="tile-label">{c.label}</span>
            <span className="tile-count">{s.byCategory[c.key]}개</span>
          </div>
        ))}
      </section>

      {s.bestDay && (
        <section className="card best">
          <span className="caption">가장 많이 치운 날</span>
          <span className="best-day">{formatDayKey(s.bestDay.day)}</span>
          <span className="body">이날 {s.bestDay.count}개를 비웠어요</span>
        </section>
      )}

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
