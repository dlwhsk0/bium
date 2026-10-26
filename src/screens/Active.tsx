import { useEffect, useState } from 'react'
import { periodLabel, summarize, type Bium } from '../lib/bium'
import { CATEGORIES, type CategoryKey } from '../lib/categories'

interface Props {
  bium: Bium
  onToss: (category: CategoryKey) => void
  onUndo: () => void
  onFinish: () => void
}

export function Active({ bium, onToss, onUndo, onFinish }: Props) {
  const stats = summarize(bium)
  // 실수로 끝내지 않게 두 번 눌러야 끝난다. 3초 안에 다시 안 누르면 원래대로.
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(t)
  }, [confirming])

  return (
    <main className="screen active">
      <header className="bar">
        <div>
          <h1 className="title">{bium.name}</h1>
          <p className="period">{periodLabel(bium)}</p>
        </div>
        <button className="undo" onClick={onUndo} disabled={bium.tosses.length === 0}>
          ↶ 되돌리기
        </button>
      </header>

      <section className="bin" aria-live="polite">
        <span className="bin-icon" aria-hidden>🗑️</span>
        <strong className="bin-total">{stats.total}</strong>
      </section>

      <section className="cats">
        {CATEGORIES.map((c) => (
          <button key={c.key} className="cat" onClick={() => onToss(c.key)}>
            <span className="cat-icon" aria-hidden>{c.icon}</span>
            <span className="cat-label">{c.label}</span>
            <span className="cat-count">{stats.byCategory[c.key]}</span>
          </button>
        ))}
      </section>

      <button
        className={confirming ? 'finish confirming' : 'finish'}
        onClick={() => (confirming ? onFinish() : setConfirming(true))}
      >
        {confirming ? '한 번 더 누르면 끝나요' : '비움 끝'}
      </button>
    </main>
  )
}
