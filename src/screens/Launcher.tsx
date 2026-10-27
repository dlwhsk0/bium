import { useEffect, useState, type MouseEvent } from 'react'
import type { Platform } from '../lib/platform'
import { BiumWidget } from '../components/BiumWidget'
import { ClockWidget } from '../components/ClockWidget'
import { Emoji } from '../components/Emoji'
import { Sheet } from '../components/Sheet'
import { useLongPress } from '../lib/useLongPress'
import { startBium, toss } from '../lib/bium'
import { loadActive, loadCategories, saveActive, type Settings } from '../lib/storage'

export type AppId = 'bium' | 'vent' | 'mind' | 'settings'

interface AppInfo {
  id: AppId
  name: string
  /** lib/emoji.ts의 이모지 이름 */
  icon: string
}

// 앱 셋. 비움은 상자, Chat(털어놓는 톡방)은 둥근 말풍선, 버림은 쓰레기통.
const APPS: AppInfo[] = [
  { id: 'bium', name: '비움', icon: 'package' },
  { id: 'vent', name: 'Chat', icon: 'chat' },
  { id: 'mind', name: '버림', icon: 'wastebasket' },
  { id: 'settings', name: '설정', icon: 'gear' },
]


interface Props {
  /** 누른 아이콘의 화면 위치(가운데)에서 앱이 커지며 열린다 */
  onOpen: (app: AppId, origin: { x: number; y: number }) => void
  platform: Platform
  /** CSS background 값(설정의 배경화면) */
  wallpaper: string
  clock24: boolean
  showWidget: boolean
  widgetSize: Settings['widgetSize']
  onChangeSettings: (patch: Partial<Settings>) => void
  /** 홈 화면을 꾹 눌러 "배경화면 바꾸기" → 설정 앱의 배경화면 화면 */
  onOpenWallpaper: () => void
}

/** 꾹 누르면 뜨는 시트: 홈 화면(배경화면, 위젯 추가) / 시계(24·12시간) / 비움 위젯(크기, 제거) */
type LongPressSheet = 'home' | 'clock' | 'widget'

const noop = () => {}

/** 시트 안 고르기 목록: 고른 것에 체크 */
function Choice({ label, sub, on, onPick }: { label: string; sub?: string; on: boolean; onPick: () => void }) {
  return (
    <li>
      <button className={on ? 'choice on' : 'choice'} onClick={onPick} aria-pressed={on}>
        <span>{label}</span>
        {sub && <span className="choice-sub">{sub}</span>}
      </button>
    </li>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 휴대폰 홈 화면. 아이폰이면 아이폰 위젯·아이콘, 안드로이드면 갤럭시(One UI) 시계·아이콘. */
export function Launcher(props: Props) {
  const { onOpen, platform, wallpaper, clock24, showWidget, widgetSize, onChangeSettings, onOpenWallpaper } = props
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    // 아이폰 시계 위젯의 초침이 돌도록 1초마다
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // 비우는 중인 비움. 아래 비움 위젯에서 바로 넣으면 저장까지 해서, 비움 앱을 열면 그대로 이어진다.
  const [active, setActive] = useState(loadActive)
  const [categories] = useState(loadCategories)
  const [sheet, setSheet] = useState<LongPressSheet | null>(null)
  const close = () => setSheet(null)

  function tossFromWidget(categoryId: string) {
    const next = toss(active ?? startBium(), categoryId)
    saveActive(next)
    setActive(next)
  }
  const hhmm = (d: Date, h24: boolean) =>
    h24 ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${d.getHours() < 12 ? '오전' : '오후'} ${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`

  const open = (id: AppId) => (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.querySelector('.app-icon')!.getBoundingClientRect()
    onOpen(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }

  // 실제 폰처럼 꾹 누르기: 빈 곳 → 홈 화면, 시계 → 시간 형식
  const bgPress = useLongPress(noop, () => setSheet('home'))
  const clockPress = useLongPress(noop, () => setSheet('clock'))

  return (
    <main
      className={`launcher ${platform}`}
      style={{ background: wallpaper }}
      {...bgPress}
      onPointerDown={(e) => {
        // 아이콘·위젯 위에서 누른 건 빈 곳이 아니다
        if (!(e.target as HTMLElement).closest('.app, .ios-widget, .galaxy-clock, .bium-widget, .sheet-backdrop')) bgPress.onPointerDown(e)
      }}
      onClick={undefined}
    >
      <ClockWidget
        platform={platform}
        now={now}
        clock24={clock24}
        note={active ? `${active.tosses.length}개째 비우는 중` : '오늘 하나만 버려볼까요'}
        press={clockPress}
      />

      <nav className="app-grid" aria-label="앱">
        {APPS.map((a) => (
          <button key={a.id} className="app" onClick={open(a.id)}>
            <span className={`app-icon app-${a.id}`}>
              <Emoji name={a.icon} />
            </span>
            <span className="app-name">{a.name}</span>
          </button>
        ))}
      </nav>

      {showWidget && (
        <BiumWidget
          active={active}
          categories={categories}
          size={widgetSize}
          onToss={tossFromWidget}
          onSettings={() => setSheet('widget')}
        />
      )}

      {sheet === 'home' && (
        <Sheet title="홈 화면" onClose={close}>
          <ul className="sheet-list">
            <li>
              <button onClick={() => (close(), onOpenWallpaper())}>배경화면 바꾸기</button>
            </li>
            {!showWidget && (
              <li>
                <button onClick={() => (close(), onChangeSettings({ widget: true }))}>비움 위젯 추가</button>
              </li>
            )}
          </ul>
        </Sheet>
      )}

      {sheet === 'clock' && (
        <Sheet title="시간 형식" onClose={close}>
          <ul className="sheet-list">
            <Choice label="24시간제" sub={hhmm(now, true)} on={clock24} onPick={() => (close(), onChangeSettings({ clock24: true }))} />
            <Choice label="12시간제" sub={hhmm(now, false)} on={!clock24} onPick={() => (close(), onChangeSettings({ clock24: false }))} />
          </ul>
        </Sheet>
      )}

      {sheet === 'widget' && (
        <Sheet title="비움 위젯" onClose={close}>
          <ul className="sheet-list">
            <Choice label="크게" sub="칸마다 큰 아이콘과 숫자" on={widgetSize === 'large'} onPick={() => (close(), onChangeSettings({ widgetSize: 'large' }))} />
            <Choice label="작게" sub="한 줄에 아이콘과 숫자" on={widgetSize === 'small'} onPick={() => (close(), onChangeSettings({ widgetSize: 'small' }))} />
            <li>
              <button className="danger" onClick={() => (close(), onChangeSettings({ widget: false }))}>
                위젯 제거
              </button>
            </li>
          </ul>
        </Sheet>
      )}
    </main>
  )
}
