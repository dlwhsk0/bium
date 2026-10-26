import { periodLabel, summarize, type Bium } from '../lib/bium'
import { CATEGORIES } from '../lib/categories'
import { formatDayKey } from '../lib/date'

interface Props {
  bium: Bium
  onClose: () => void
}

export function Result({ bium, onClose }: Props) {
  const s = summarize(bium)

  return (
    <main className="screen result">
      <p className="eyebrow">비움 완료</p>
      <h1 className="title">{bium.name}</h1>
      <p className="period">{periodLabel(bium)}</p>

      <div className="total">
        <span className="total-num">{s.total}</span>개 비웠어요
      </div>

      <ul className="breakdown">
        {CATEGORIES.map((c) => (
          <li key={c.key}>
            <span>{c.icon} {c.label}</span>
            <strong>{s.byCategory[c.key]}</strong>
          </li>
        ))}
      </ul>

      {s.bestDay && (
        <div className="best">
          <span>🏆 가장 많이 치운 날</span>
          <strong>{formatDayKey(s.bestDay.day)} · {s.bestDay.count}개</strong>
        </div>
      )}

      <button className="primary" onClick={onClose}>처음으로</button>
    </main>
  )
}
