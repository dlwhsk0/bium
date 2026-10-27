import { useEffect, useState, type CSSProperties } from 'react'
import { BiumApp } from './apps/BiumApp'
import { loadSettings, loadWallpaperPhoto, saveSettings, saveWallpaperPhoto, type Settings as SettingsData } from './lib/storage'
import { wallpaperCss } from './lib/wallpapers'
import { Launcher, type AppId } from './screens/Launcher'
import { Mind } from './screens/Mind'
import { Settings, type Page as SettingsPage } from './screens/Settings'
import { Vent } from './screens/Vent'

const darkQuery = matchMedia('(prefers-color-scheme: dark)')

/**
 * 휴대폰 화면처럼: 열면 홈 화면(런처)이 나오고, 앱 아이콘을 누르면 그 자리에서 앱이 커지며 열린다.
 * 각 앱 왼쪽 위 "‹"로 홈 화면에 돌아온다. 화면 모양·테마·배경화면 같은 설정은 여기서 들고 있다.
 */
export default function App() {
  const [app, setApp] = useState<AppId | null>(null)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const [settings, setSettings] = useState(loadSettings)
  const [photo, setPhoto] = useState(loadWallpaperPhoto)
  const [systemDark, setSystemDark] = useState(darkQuery.matches)
  // 홈 화면을 꾹 눌러 "배경화면 바꾸기"로 열면 설정 앱이 배경화면 화면부터 열린다
  const [settingsPage, setSettingsPage] = useState<SettingsPage>('main')
  const home = () => setApp(null)

  // 테마: 시스템이면 기기 설정을 따라간다
  useEffect(() => {
    const onChange = () => setSystemDark(darkQuery.matches)
    darkQuery.addEventListener('change', onChange)
    return () => darkQuery.removeEventListener('change', onChange)
  }, [])
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101013' : '#f2f4f6')
  }, [dark])

  function changeSettings(patch: Partial<SettingsData>) {
    setSettings((s) => {
      const next = { ...s, ...patch }
      saveSettings(next)
      return next
    })
  }

  if (!app) {
    return (
      <Launcher
        platform={settings.platform}
        wallpaper={wallpaperCss(settings.wallpaper, photo, dark)}
        clock24={settings.clock24}
        showWidget={settings.widget}
        widgetSize={settings.widgetSize}
        onChangeSettings={changeSettings}
        onOpenWallpaper={() => {
          setOrigin({ x: innerWidth / 2, y: innerHeight / 2 })
          setSettingsPage('wallpaper')
          setApp('settings')
        }}
        onOpen={(id, o) => {
          setOrigin(o)
          setSettingsPage('main')
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
      {app === 'settings' && (
        <Settings
          settings={settings}
          photo={photo}
          dark={dark}
          onChange={changeSettings}
          onPhoto={(data) => {
            setPhoto(data)
            saveWallpaperPhoto(data)
          }}
          onBack={home}
          initialPage={settingsPage}
        />
      )}
    </div>
  )
}
