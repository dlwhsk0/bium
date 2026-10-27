import { useEffect, useState, type MouseEvent } from 'react'
import { platform } from '../lib/platform'
import { loadActive } from '../lib/storage'

export type AppId = 'bium' | 'vent' | 'mind'

interface AppInfo {
  id: AppId
  name: string
  /** 3D 아이콘 그림. 없으면 직접 그린 아이콘(Chat의 둥근 말풍선) */
  icon?: string
}

// 앱 셋. 비움은 상자, Chat(털어놓는 톡방)은 둥근 말풍선, 버림은 쓰레기통.
const APPS: AppInfo[] = [
  { id: 'bium', name: '비움', icon: '/icons/package.png' },
  { id: 'vent', name: 'Chat' },
  { id: 'mind', name: '버림', icon: '/icons/wastebasket.png' },
]

/** 동글동글한 말풍선. 다른 3D 아이콘(Fluent)처럼 빛 받은 흰색 → 연보라 그늘, 하이라이트, 그림자. */
function ChatBubble() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <defs>
        <radialGradient id="chat-bubble-fill" cx="36%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f3f0fa" />
          <stop offset="1" stopColor="#cdbff0" />
        </radialGradient>
        <filter id="chat-bubble-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#8a5a00" floodOpacity="0.28" />
        </filter>
      </defs>
      <g filter="url(#chat-bubble-shadow)" fill="url(#chat-bubble-fill)">
        <circle cx="33" cy="29" r="21" />
        <path d="M18.5 40c-.6 5.4-2.8 9.6-6.5 12.8 6.4.4 12.1-1.8 16.4-5.6z" />
      </g>
      <ellipse cx="25" cy="19" rx="8" ry="4.2" fill="#ffffff" opacity="0.85" transform="rotate(-24 25 19)" />
    </svg>
  )
}

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
              {a.icon ? <img src={a.icon} alt="" draggable={false} /> : <ChatBubble />}
            </span>
            <span className="app-name">{a.name}</span>
          </button>
        ))}
      </nav>
    </main>
  )
}
