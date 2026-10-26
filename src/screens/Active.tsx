import { useState } from 'react'
import { periodLabel, type Bium } from '../lib/bium'
import { CATEGORIES, type CategoryKey } from '../lib/categories'
import { useTwoStep } from '../lib/useTwoStep'
import { Bin } from '../components/Bin'

interface Props {
  bium: Bium
  onToss: (category: CategoryKey) => void
  onUndo: () => void
  onFinish: () => void
}

export function Active({ bium, onToss, onUndo, onFinish }: Props) {
  // 실수로 끝내지 않게 두 번 눌러야 끝난다
  const finishButton = useTwoStep(onFinish)
  // 화면을 연 뒤에 넣은 것만 떨어지게 한다. 이미 쌓여 있던 건 그대로 둔다.
  const [openedAt] = useState(() => Date.now())

  function handleToss(category: CategoryKey) {
    onToss(category)
    navigator.vibrate?.(12) // 안드로이드만. iOS 사파리는 미지원이라 무시된다
  }

  return (
    <main className="screen active">
      <header className="summary">
        <p className="caption">{periodLabel(bium)}</p>
        <p className="big-number" aria-live="polite">
          {bium.tosses.length}
          <span className="unit">개</span>
        </p>
      </header>

      <section className="bins">
        {CATEGORIES.map((c) => (
          <Bin
            key={c.key}
            category={c.key}
            tosses={bium.tosses.filter((t) => t.category === c.key)}
            animateAfter={openedAt}
            onToss={() => handleToss(c.key)}
          />
        ))}
      </section>

      <footer className="actions">
        <button className="text-button" onClick={onUndo} disabled={bium.tosses.length === 0}>
          방금 넣은 것 되돌리기
        </button>
        <button
          className={finishButton.confirming ? 'cta confirming' : 'cta'}
          onClick={finishButton.press}
        >
          {finishButton.confirming ? '한 번 더 누르면 끝나요' : '비움 끝내기'}
        </button>
      </footer>
    </main>
  )
}
