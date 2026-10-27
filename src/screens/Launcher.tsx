import { useEffect, useState, type MouseEvent } from 'react'
import { platform } from '../lib/platform'
import { BiumWidget } from '../components/BiumWidget'
import { startBium, toss } from '../lib/bium'
import { loadActive, loadCategories, saveActive } from '../lib/storage'

export type AppId = 'bium' | 'vent' | 'mind'

interface AppInfo {
  id: AppId
  name: string
  icon: string
}

// 앱 셋. 비움은 상자, Chat(털어놓는 톡방)은 둥근 말풍선, 버림은 쓰레기통.
// 말풍선은 3dicons(CC0)의 chat clay — Fluent 말풍선은 동그랗지 않아서.
const APPS: AppInfo[] = [
  { id: 'bium', name: '비움', icon: '/icons/package.png' },
  { id: 'vent', name: 'Chat', icon: '/icons/chat.png' },
  { id: 'mind', name: '버림', icon: '/icons/wastebasket.png' },
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

  // 비우는 중인 비움. 아래 비움 위젯에서 바로 넣으면 저장까지 해서, 비움 앱을 열면 그대로 이어진다.
  const [active, setActive] = useState(loadActive)
  const [categories] = useState(loadCategories)

  function tossFromWidget(categoryId: string) {
    const next = toss(active ?? startBium(), categoryId)
    saveActive(next)
    setActive(next)
  }
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

      <BiumWidget active={active} categories={categories} onToss={tossFromWidget} />
    </main>
  )
}
