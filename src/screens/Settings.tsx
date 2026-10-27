import { useRef, useState, type ReactNode } from 'react'
import { WallpaperCropper } from '../components/WallpaperCropper'
import type { Platform } from '../lib/platform'
import type { Settings as SettingsData, ThemeMode } from '../lib/storage'
import { WALLPAPERS, wallpaperCss, type WallpaperId } from '../lib/wallpapers'

interface Props {
  settings: SettingsData
  photo: string | null
  /** 지금 다크로 보이는지(테마가 시스템이면 기기 설정에 따름) */
  dark: boolean
  onChange: (patch: Partial<SettingsData>) => void
  /** 배경화면 사진(잘라서 줄인 JPEG data URL) */
  onPhoto: (data: string) => void
  onBack: () => void
  /** 홈 화면을 꾹 눌러 "배경화면 바꾸기"로 들어오면 바로 배경화면 화면 */
  initialPage?: Page
}

export type Page = 'main' | 'platform' | 'theme' | 'wallpaper'

const PLATFORM_NAMES: Record<Platform, string> = { ios: '아이폰', android: '안드로이드' }
const THEME_NAMES: Record<ThemeMode, string> = { system: '시스템 설정', light: '라이트', dark: '다크' }
const VERSION = '1.0'

const wallpaperName = (id: WallpaperId) => (id === 'photo' ? '내 사진' : WALLPAPERS.find((w) => w.id === id)?.name ?? '')

function Chevron() {
  return (
    <svg className="set-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check() {
  return (
    <svg className="set-check" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className={on ? 'set-switch on' : 'set-switch'} onClick={onToggle}>
      <span className="set-switch-knob" />
    </button>
  )
}

/** 한 묶음(아이폰: 둥근 카드, 안드로이드: 파란 작은 제목 + 목록) */
function Group({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="set-group">
      {title && <h2 className="set-group-title">{title}</h2>}
      <div className="set-group-body">{children}</div>
      {footer && <p className="set-group-footer">{footer}</p>}
    </section>
  )
}

/** 한 줄. value는 아이폰에선 오른쪽 회색, 안드로이드에선 제목 아래 작은 글씨. */
function Row(props: { label: string; value?: string; onClick?: () => void; right?: ReactNode; checked?: boolean }) {
  const { label, value, onClick, right, checked } = props
  const inner = (
    <>
      <span className="set-row-text">
        <span className="set-row-label">{label}</span>
        {value && <span className="set-row-value">{value}</span>}
      </span>
      {right}
      {checked && <Check />}
      {onClick && checked === undefined && !right && <Chevron />}
    </>
  )
  if (!onClick) return <div className="set-row">{inner}</div>
  return (
    <button className="set-row" onClick={onClick} aria-pressed={checked}>
      {inner}
    </button>
  )
}

/** 설정 앱. 화면 모양에서 고른 쪽(아이폰/안드로이드)의 실제 설정 앱처럼 보인다. */
export function Settings({ settings, photo, dark, onChange, onPhoto, onBack, initialPage = 'main' }: Props) {
  const [page, setPage] = useState<Page>(initialPage)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const { platform } = settings
  const titles: Record<Page, string> = { main: '설정', platform: '화면 모양', theme: '테마', wallpaper: '배경화면' }

  const back = () => (page === 'main' ? onBack() : setPage('main'))

  if (cropSrc) {
    return (
      <main className={`screen settings ${platform}`}>
        <header className="set-bar">
          <span className="set-bar-title">사진 자르기</span>
        </header>
        <WallpaperCropper
          src={cropSrc}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc)
            setCropSrc(null)
          }}
          onDone={(data) => {
            URL.revokeObjectURL(cropSrc)
            setCropSrc(null)
            onPhoto(data)
            onChange({ wallpaper: 'photo' })
          }}
        />
      </main>
    )
  }

  return (
    <main className={`screen settings ${platform}`}>
      <header className={page === 'main' ? 'set-bar main' : 'set-bar'}>
        <button className="set-back" onClick={back} aria-label={page === 'main' ? '홈 화면으로' : '설정으로'}>
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
            {platform === 'android' ? (
              <path d="M20 12H5m6-7l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          {platform === 'ios' && page !== 'main' && <span>설정</span>}
        </button>
        <span className="set-bar-title">{titles[page]}</span>
      </header>
      {page === 'main' && platform === 'ios' && <h1 className="set-large-title">설정</h1>}

      <div className="scroll-area set-body">
        {page === 'main' && (
          <>
            <Group title="화면" footer="홈 화면 빈 곳, 시계, 비움 위젯을 꾹 누르면 바로 바꿀 수 있어요.">
              <Row label="화면 모양" value={PLATFORM_NAMES[platform]} onClick={() => setPage('platform')} />
              <Row label="테마" value={THEME_NAMES[settings.theme]} onClick={() => setPage('theme')} />
              <Row label="배경화면" value={wallpaperName(settings.wallpaper)} onClick={() => setPage('wallpaper')} />
            </Group>
            <Group title="사운드와 햅틱" footer="아이폰 브라우저는 진동을 지원하지 않아요.">
              <Row label="진동" right={<Switch label="진동" on={settings.haptics} onToggle={() => onChange({ haptics: !settings.haptics })} />} />
            </Group>
            <Group title="정보">
              <Row label="버전" value={VERSION} />
            </Group>
          </>
        )}

        {page === 'platform' && (
          <Group footer="홈 화면과 설정이 고른 쪽 모양으로 바뀌어요.">
            {(['ios', 'android'] as const).map((p) => (
              <Row key={p} label={PLATFORM_NAMES[p]} checked={platform === p} onClick={() => onChange({ platform: p })} />
            ))}
          </Group>
        )}

        {page === 'theme' && (
          <Group footer="시스템 설정을 고르면 기기의 라이트/다크 모드를 따라가요.">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <Row key={t} label={THEME_NAMES[t]} checked={settings.theme === t} onClick={() => onChange({ theme: t })} />
            ))}
          </Group>
        )}

        {page === 'wallpaper' && (
          <>
            <div className="wall-preview" style={{ background: wallpaperCss(settings.wallpaper, photo, dark) }} aria-hidden>
              <span className={`wall-preview-icons ${platform}`}>
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
            <Group title="기본 배경화면">
              <div className="wall-grid" role="radiogroup" aria-label="기본 배경화면">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    role="radio"
                    aria-checked={settings.wallpaper === w.id}
                    className={settings.wallpaper === w.id ? 'wall-swatch selected' : 'wall-swatch'}
                    onClick={() => onChange({ wallpaper: w.id })}
                  >
                    <span className="wall-swatch-color" style={{ background: dark ? w.dark : w.light }} />
                    <span className="wall-swatch-name">{w.name}</span>
                  </button>
                ))}
              </div>
            </Group>
            <Group title="내 사진" footer="고른 사진은 이 기기에만 저장돼요.">
              {photo && <Row label="내 사진 쓰기" checked={settings.wallpaper === 'photo'} onClick={() => onChange({ wallpaper: 'photo' })} />}
              <Row label={photo ? '다른 사진 고르기' : '사진 고르기'} onClick={() => fileInput.current?.click()} />
            </Group>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) setCropSrc(URL.createObjectURL(file))
              }}
            />
          </>
        )}
      </div>
    </main>
  )
}
