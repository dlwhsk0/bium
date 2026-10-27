import { useEffect, useState, type MouseEvent } from 'react'
import { platform } from '../lib/platform'
import { loadActive } from '../lib/storage'

export type AppId = 'bium' | 'vent' | 'mind'

interface AppInfo {
  id: AppId
  name: string
  icon: string
}

// 앱 셋. 비움은 상자, 하소연은 채팅, 쪽지 버리기는 쓰레기통.
const APPS: AppInfo[] = [
  { id: 'bium', name: '비움', icon: '/icons/package.png' },
  { id: 'vent', name: '하소연', icon: '/icons/speech.png' },
  { id: 'mind', name: '쪽지 버리기', icon: '/icons/wastebasket.png' },
]

interface Props {
  /** 누른 아이콘의 화면 위치(가운데)에서 앱이 커지며 열린다 */
  onOpen: (app: AppId, origin: { x: number; y: number }) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 휴대폰 홈 화면. 아이폰이면 둥근 사각 아이콘, 안드로이드면 동그란 아이콘. */
export function Launcher({ onOpen }: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(t)
  }, [])

  // 위젯: 비우는 중이면 개수, 아니면 한마디
  const [active] = useState(loadActive)
  const date = `${now.getMonth() + 1}월 ${now.getDate()}일 ${'일월화수목금토'[now.getDay()]}요일`

  const open = (id: AppId) => (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.querySelector('.app-icon')!.getBoundingClientRect()
    onOpen(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }

  return (
    <main className={`launcher ${platform}`}>
      <section className="widget" aria-label="오늘">
        <p className="widget-time">
          {pad(now.getHours())}:{pad(now.getMinutes())}
        </p>
        <p className="widget-date">{date}</p>
        <p className="widget-note">
          {active ? `${active.tosses.length}개째 비우는 중` : '오늘 하나만 버려볼까요'}
        </p>
      </section>

      <nav className="app-grid" aria-label="앱">
        {APPS.map((a) => (
          <button key={a.id} className="app" onClick={open(a.id)}>
            <span className={`app-icon app-${a.id}`}>
              <img src={a.icon} alt="" draggable={false} />
            </span>
            <span className="app-name">{a.name}</span>
          </button>
        ))}
      </nav>
    </main>
  )
}
