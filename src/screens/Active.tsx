import { useState } from 'react'
import { periodLabel, type Bium } from '../lib/bium'
import { visibleCategories, type Category } from '../lib/categories'
import { useTwoStep } from '../lib/useTwoStep'
import { Bin } from '../components/Bin'

interface Props {
  bium: Bium
  categories: Category[]
  onToss: (categoryId: string) => void
  onUndo: () => void
  onFinish: () => void
  onEditCategories: () => void
}

export function Active({ bium, categories, onToss, onUndo, onFinish, onEditCategories }: Props) {
  // 실수로 끝내지 않게 두 번 눌러야 끝난다
  const finishButton = useTwoStep(onFinish)
  // 화면을 연 뒤에 넣은 것만 떨어지게 한다. 이미 쌓여 있던 건 그대로 둔다.
  const [openedAt] = useState(() => Date.now())

  function handleToss(categoryId: string) {
    onToss(categoryId)
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
        {visibleCategories(categories).map((c) => (
          <Bin
            key={c.id}
            category={c}
            tosses={bium.tosses.filter((t) => t.category === c.id)}
            animateAfter={openedAt}
            onToss={() => handleToss(c.id)}
          />
        ))}
      </section>

      <footer className="actions">
        <div className="text-buttons">
          <button className="text-button" onClick={onUndo} disabled={bium.tosses.length === 0}>
            방금 넣은 것 되돌리기
          </button>
          <button className="text-button" onClick={onEditCategories}>
            카테고리 편집
          </button>
        </div>
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
