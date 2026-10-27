import { useState, type CSSProperties } from 'react'
import { BiumApp } from './apps/BiumApp'
import { Launcher, type AppId } from './screens/Launcher'
import { Mind } from './screens/Mind'
import { Vent } from './screens/Vent'

/**
 * 휴대폰 화면처럼: 열면 홈 화면(런처)이 나오고, 앱 아이콘을 누르면 그 자리에서 앱이 커지며 열린다.
 * 각 앱 왼쪽 위 "‹"로 홈 화면에 돌아온다.
 */
export default function App() {
  const [app, setApp] = useState<AppId | null>(null)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const home = () => setApp(null)

  if (!app) {
    return (
      <Launcher
        onOpen={(id, o) => {
          setOrigin(o)
          setApp(id)
        }}
      />
    )
  }

  return (
    <div className="app-window" style={{ transformOrigin: `${origin.x}px ${origin.y}px` } as CSSProperties}>
      {app === 'bium' && <BiumApp onExit={home} />}
      {app === 'vent' && <Vent onBack={home} />}
      {app === 'mind' && <Mind onBack={home} />}
    </div>
  )
}
