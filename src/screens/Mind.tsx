import { useRef, useState, type CSSProperties } from 'react'
import { BackButton } from '../components/BackButton'
import { Emoji } from '../components/Emoji'
import { loadMindCount, saveMindCount } from '../lib/storage'
import { buzz } from '../lib/haptics'

interface Props {
  onBack: () => void
}

/**
 * writing: 종이에 적는 중
 * crumpling: 글씨가 흐려지며 종이가 구겨져 공이 된다
 * throwing: 공이 포물선을 그리며 쓰레기통으로
 * done: "버렸어요" 잠깐 보여준 뒤 새 종이
 */
type Phase = 'writing' | 'crumpling' | 'throwing' | 'done'

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// index.css의 crumple / toss-arc 길이와 맞춘다. animationend는 브라우저에 따라 빠질 때가 있어 타이머로 넘긴다.
const CRUMPLE_MS = 900
const TOSS_MS = 750
const DONE_MS = 1600

export function Mind({ onBack }: Props) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('writing')
  const [count, setCount] = useState(loadMindCount)
  // 새 종이가 들어올 때마다 key를 바꿔 들어오는 애니메이션을 다시 재생
  const [sheet, setSheet] = useState(0)
  // 공이 날아갈 거리: 종이 가운데 → 쓰레기통 입구
  const [flight, setFlight] = useState({ dx: 0, dy: 0 })
  const paperRef = useRef<HTMLDivElement>(null)
  const binRef = useRef<HTMLSpanElement>(null)

  function throwAway() {
    if (!text.trim() || phase !== 'writing') return
    ;(document.activeElement as HTMLElement | null)?.blur() // 키보드 내리기
    const paper = paperRef.current?.getBoundingClientRect()
    const bin = binRef.current?.getBoundingClientRect()
    if (paper && bin) {
      setFlight({
        dx: bin.left + bin.width / 2 - (paper.left + paper.width / 2),
        dy: bin.top + bin.height * 0.3 - (paper.top + paper.height / 2),
      })
    }
    if (reduceMotion()) return landed()
    setPhase('crumpling')
    setTimeout(() => setPhase('throwing'), CRUMPLE_MS)
    setTimeout(landed, CRUMPLE_MS + TOSS_MS)
  }

  function landed() {
    buzz([12, 40, 12])
    setCount((c) => {
      saveMindCount(c + 1)
      return c + 1
    })
    setText('') // 적은 내용은 여기서 사라진다
    setPhase('done')
    setTimeout(() => {
      setPhase('writing')
      setSheet((s) => s + 1)
    }, DONE_MS)
  }

  return (
    <main className="screen mind">
      <BackButton onClick={onBack} />
      <header className="summary">
        <h1 className="title">버림</h1>
        <p className="body">
          버리고 싶은 생각이나 마음을 적어보세요.
          <br />
          적은 내용은 어디에도 저장되지 않아요.
        </p>
      </header>

      <div className="paper-area">
        {phase === 'done' ? (
          <div className="mind-done" role="status">
            <p className="mind-done-title">버렸어요</p>
            <p className="body">그 마음은 이제 쓰레기통 안에 있어요.</p>
          </div>
        ) : (
          <div
            className={`paper-flight ${phase === 'throwing' ? 'flying' : ''}`}
            style={{ '--dx': `${flight.dx}px`, '--dy': `${flight.dy}px` } as CSSProperties}
          >
            <div
              key={sheet}
              ref={paperRef}
              className={`paper ${phase === 'crumpling' || phase === 'throwing' ? 'crumpled' : ''}`}
            >
              <textarea
                className="paper-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="오늘 나를 무겁게 한 것"
                maxLength={300}
                readOnly={phase !== 'writing'}
                aria-label="버리고 싶은 생각이나 마음"
              />
            </div>
          </div>
        )}
      </div>

      <span ref={binRef} key={count} className={count > 0 && phase === 'done' ? 'mind-bin wobble' : 'mind-bin'}>
        <Emoji name="wastebasket" />
      </span>

      <footer className="actions">
        <p className="caption mind-count">{count > 0 && `지금까지 마음 ${count}개를 버렸어요`}</p>
        <button className="cta" onClick={throwAway} disabled={!text.trim() || phase !== 'writing'}>
          구겨서 버리기
        </button>
      </footer>
    </main>
  )
}
