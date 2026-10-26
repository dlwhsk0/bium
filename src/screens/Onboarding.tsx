import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Toss } from '../lib/bium'
import { iconFor, seeded } from '../lib/categories'
import { Bin } from '../components/Bin'
import { ROW_H, slot } from '../lib/pile'

interface Props {
  /** 마지막 장의 버튼: 바로 비움을 시작한다 */
  onStart: () => void
  onSkip: () => void
}

interface Step {
  title: ReactNode
  body: ReactNode
  visual: () => ReactNode
}

/** 학교·회사에서 돌아와 그대로인 방: 옷과 쓰레기가 뒤엉킨 더미 */
function MessyRoom() {
  const things = [
    ['coat', -70, 0, -18],
    ['jeans', 10, 6, 24],
    ['cup', 78, 2, -8],
    ['tshirt', -30, 46, 12],
    ['newspaper', 44, 44, -26],
    ['socks', -84, 70, 30],
    ['can', 4, 88, 8],
    ['tissue', 82, 84, -20],
    ['scarf', -40, 120, -10],
  ] as const
  return (
    <div className="ob-stage">
      {things.map(([icon, x, y, r], i) => (
        <img
          key={icon}
          className="ob-thing"
          src={`/icons/${icon}.png`}
          alt=""
          draggable={false}
          style={{ '--x': `${x}px`, '--y': `${y}px`, '--r': `${r}deg`, animationDelay: `${i * 60}ms` } as CSSProperties}
        />
      ))}
    </div>
  )
}

/** 눈앞의 휴지 하나 */
function OneTissue() {
  return (
    <div className="ob-stage">
      <img className="ob-hero-icon floating" src="/icons/tissue-lg.png" alt="" draggable={false} />
      <span className="ob-shadow" />
    </div>
  )
}

/** 옷이 하나씩 떨어져 차곡차곡 쌓인다 */
function OneByOne() {
  const count = 12
  return (
    <div className="ob-stage">
      <div className="ob-card">
        <span className="pile">
          {Array.from({ length: count }, (_, i) => {
            const { x, row } = slot(i)
            const at = 1000 + i * 7
            const style = {
              left: `${x + (seeded(at + 1) - 0.5) * 6}%`,
              bottom: `${row * ROW_H}px`,
              '--r': `${(seeded(at + 3) - 0.5) * 50}deg`,
              animationDelay: `${200 + i * 140}ms`,
            } as CSSProperties
            return <img key={i} className="item falling" src={iconFor('clothes', at)} alt="" style={style} draggable={false} />
          })}
        </span>
      </div>
    </div>
  )
}

/** 직접 눌러보는 쓰레기 카드. 미리 몇 개 들어 있다. */
function TryIt() {
  const [openedAt] = useState(() => Date.now())
  const [tosses, setTosses] = useState<Toss[]>([
    { category: 'trash', at: 11 },
    { category: 'trash', at: 23 },
    { category: 'trash', at: 37 },
  ])
  return (
    <div className="ob-stage">
      <div className="ob-try">
        <Bin
          category="trash"
          tosses={tosses}
          animateAfter={openedAt}
          onToss={() => {
            setTosses((t) => [...t, { category: 'trash', at: Date.now() }])
            navigator.vibrate?.(12)
          }}
        />
      </div>
    </div>
  )
}

/** 다 치운 방: 빗자루와 반짝임 */
function Sparkling() {
  return (
    <div className="ob-stage">
      <img className="ob-hero-icon" src="/icons/broom.png" alt="" draggable={false} />
      <img className="ob-sparkle" src="/icons/sparkles.png" alt="" draggable={false} />
    </div>
  )
}

const STEPS: Step[] = [
  {
    visual: MessyRoom,
    title: (
      <>
        학교 가고 회사 가고
        <br />
        돌아오면 방은 그대로예요
      </>
    ),
    body: (
      <>
        벗어둔 옷은 의자에, 휴지는 책상에 그대로.
        <br />
        보고 있으면 괜히 마음까지 무거워져요.
      </>
    ),
  },
  {
    visual: OneTissue,
    title: (
      <>
        어디서부터 할지 모르겠다면
        <br />
        눈앞의 휴지 하나부터
      </>
    ),
    body: (
      <>
        방 전체를 치우려고 하지 않아도 돼요.
        <br />
        지금 보이는 것 하나만 버리면 그게 시작이에요.
      </>
    ),
  },
  {
    visual: OneByOne,
    title: (
      <>
        많아 보여도
        <br />
        하나씩 넣다 보면 금방이에요
      </>
    ),
    body: (
      <>
        옷 한 벌, 컵 하나. 넣을 때마다 숫자가 올라가요.
        <br />
        며칠에 나눠 해도 비움이 다 세어둘게요.
      </>
    ),
  },
  {
    visual: TryIt,
    title: (
      <>
        그리고 버리는 거,
        <br />
        은근히 재밌어요
      </>
    ),
    body: (
      <>
        누를 때마다 톡 떨어져서 차곡차곡 쌓여요.
        <br />
        위 카드를 한번 눌러보세요.
      </>
    ),
  },
  {
    visual: Sparkling,
    title: (
      <>
        오늘 하나만 버려도
        <br />
        방은 어제보다 가벼워요
      </>
    ),
    body: (
      <>
        다 치운 날엔 얼마나 비웠는지 보여드릴게요.
        <br />
        천천히 해도 괜찮아요. 응원할게요.
      </>
    ),
  },
]

export function Onboarding({ onStart, onSkip }: Props) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const { visual: Visual, title, body } = STEPS[step]
  // 좌우로 밀어서 넘기기
  const swipeFrom = useRef<number | null>(null)

  const go = (to: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, to)))

  return (
    <main
      className="screen onboarding"
      onPointerDown={(e) => (swipeFrom.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipeFrom.current === null) return
        const dx = e.clientX - swipeFrom.current
        swipeFrom.current = null
        if (dx < -50) go(step + 1)
        if (dx > 50) go(step - 1)
      }}
    >
      <header className="ob-top">
        <div className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
          {STEPS.map((_, i) => (
            <span key={i} className={i <= step ? 'ob-seg on' : 'ob-seg'} />
          ))}
        </div>
        <button className="ob-skip" onClick={onSkip} style={{ visibility: last ? 'hidden' : 'visible' }}>
          건너뛰기
        </button>
      </header>

      {/* key로 장이 바뀔 때마다 새로 그려 들어오는 애니메이션을 다시 재생 */}
      <section key={step} className="ob-page">
        <div className="ob-visual">
          <Visual />
        </div>
        <div className="ob-text">
          <h1 className="ob-title">{title}</h1>
          <p className="body">{body}</p>
        </div>
      </section>

      <footer className="actions">
        {step > 0 ? (
          <button className="text-button" onClick={() => go(step - 1)}>
            이전
          </button>
        ) : (
          <span className="ob-spacer" />
        )}
        <button className="cta" onClick={last ? onStart : () => go(step + 1)}>
          {last ? '휴지 하나부터 버리러 가기' : '다음'}
        </button>
      </footer>
    </main>
  )
}
