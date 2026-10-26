import { useRef, useState, type CSSProperties } from 'react'
import { periodLabel, summarize, type Bium } from '../lib/bium'
import { CATEGORIES, randomEmoji, type CategoryKey } from '../lib/categories'
import { useTwoStep } from '../lib/useTwoStep'

/** 화면에서 떨어지는 중인 이모지 하나. 쓰레기통에 닿으면 사라진다. */
interface Drop {
  id: number
  emoji: string
  /** 가로 시작 위치 흔들림(px) */
  x: number
  /** 떨어지면서 도는 각도(deg) */
  spin: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

interface Props {
  bium: Bium
  onToss: (category: CategoryKey) => void
  onUndo: () => void
  onFinish: () => void
}

export function Active({ bium, onToss, onUndo, onFinish }: Props) {
  const stats = summarize(bium)
  // 실수로 끝내지 않게 두 번 눌러야 끝난다
  const finishButton = useTwoStep(onFinish)

  const [drops, setDrops] = useState<Drop[]>([])
  const nextDropId = useRef(0)
  // 이모지가 들어갈 때마다 바뀌어 쓰레기통 흔들림 애니메이션을 다시 재생시킨다
  const [landed, setLanded] = useState(0)

  function handleToss(category: CategoryKey) {
    onToss(category)
    navigator.vibrate?.(12) // 안드로이드만. iOS 사파리는 미지원이라 무시된다
    const drop = { id: nextDropId.current++, emoji: randomEmoji(category), x: rand(-50, 50), spin: rand(-270, 270) }
    setDrops((d) => [...d, drop])
  }

  function handleLanded(id: number) {
    setDrops((d) => d.filter((drop) => drop.id !== id))
    setLanded((n) => n + 1)
  }

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
        <div className="drop-zone" aria-hidden>
          {drops.map((d) => (
            <span
              key={d.id}
              className="drop"
              style={{ '--x': `${d.x}px`, '--spin': `${d.spin}deg` } as CSSProperties}
              onAnimationEnd={() => handleLanded(d.id)}
            >
              {d.emoji}
            </span>
          ))}
        </div>
        <span key={landed} className={landed > 0 ? 'bin-icon wobble' : 'bin-icon'} aria-hidden>
          🗑️
        </span>
        <strong className="bin-total">{stats.total}</strong>
      </section>

      <section className="cats">
        {CATEGORIES.map((c) => (
          <button key={c.key} className="cat" onClick={() => handleToss(c.key)}>
            <span className="cat-icon" aria-hidden>{c.icon}</span>
            <span className="cat-label">{c.label}</span>
            <span className="cat-count">{stats.byCategory[c.key]}</span>
          </button>
        ))}
      </section>

      <button
        className={finishButton.confirming ? 'finish confirming' : 'finish'}
        onClick={finishButton.press}
      >
        {finishButton.confirming ? '한 번 더 누르면 끝나요' : '비움 끝'}
      </button>
    </main>
  )
}
