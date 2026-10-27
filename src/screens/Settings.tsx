import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
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

// 지금 어느 쪽 모양으로 그리는지(아이폰 설정 / 갤럭시 One UI 설정)
const PlatformCtx = createContext<Platform>('ios')

/** 줄 왼쪽 색깔 아이콘 — 아이폰은 둥근 사각형, 갤럭시는 동그라미. 흰 선 그림. */
const GLYPHS = {
  phone: <path d="M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3zM11 18h2" />,
  theme: <path d="M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18" />,
  wallpaper: <path d="M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5h.01" />,
  haptics: <path d="M9 4h6v16H9zM5 8v8M2.5 10v4M19 8v8M21.5 10v4" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01" />,
}
type Glyph = keyof typeof GLYPHS

function RowIcon({ glyph, color }: { glyph: Glyph; color: string }) {
  return (
    <span className="set-icon" style={{ background: color }} aria-hidden>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {GLYPHS[glyph]}
      </svg>
    </span>
  )
}

function Chevron() {
  return (
    <svg className="set-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** 고른 표시: 아이폰은 오른쪽 체크, 갤럭시는 왼쪽 동그라미 선택 버튼 */
function Mark({ on }: { on: boolean }) {
  const platform = useContext(PlatformCtx)
  if (platform === 'android') return <span className={on ? 'set-radio on' : 'set-radio'} aria-hidden />
  if (!on) return null
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

/** 한 묶음: 둥근 카드(아이폰, 갤럭시 모두) + 위 작은 제목 + 아래 설명 */
function Group({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="set-group">
      {title && <h2 className="set-group-title">{title}</h2>}
      <div className="set-group-body">{children}</div>
      {footer && <p className="set-group-footer">{footer}</p>}
    </section>
  )
}

/**
 * 한 줄. value: 아이폰은 오른쪽 회색 + ›, 갤럭시는 제목 아래 회색 설명.
 * checked가 있으면 고르기 목록(아이폰 체크 / 갤럭시 동그라미).
 */
function Row(props: { label: string; value?: string; icon?: [Glyph, string]; onClick?: () => void; right?: ReactNode; checked?: boolean }) {
  const { label, value, icon, onClick, right, checked } = props
  const platform = useContext(PlatformCtx)
  const inner = (
    <>
      {platform === 'android' && checked !== undefined && <Mark on={checked} />}
      {icon && <RowIcon glyph={icon[0]} color={icon[1]} />}
      <span className="set-row-text">
        <span className="set-row-label">{label}</span>
        {value && <span className="set-row-value">{value}</span>}
      </span>
      {right}
      {platform === 'ios' && checked !== undefined && <Mark on={checked} />}
      {platform === 'ios' && onClick && checked === undefined && !right && <Chevron />}
    </>
  )
  if (!onClick) return <div className="set-row">{inner}</div>
  return (
    <button className="set-row" onClick={onClick} aria-pressed={checked}>
      {inner}
    </button>
  )
}

/** 설정 앱. 화면 모양에서 고른 쪽(아이폰 / 갤럭시 One UI)의 실제 설정 앱처럼 보인다. */
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
    <PlatformCtx.Provider value={platform}>
      <main className={`screen settings ${platform} ${page === 'main' ? 'is-main' : 'is-sub'}`}>
        <header className="set-bar">
          <button className="set-back" onClick={back} aria-label={page === 'main' ? '홈 화면으로' : '설정으로'}>
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth={platform === 'ios' ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {platform === 'ios' && page !== 'main' && <span>설정</span>}
          </button>
          {platform === 'ios' && page !== 'main' && <span className="set-bar-title">{titles[page]}</span>}
        </header>
        {/* 아이폰: 메인만 큰 제목 / 갤럭시: 모든 화면 위쪽에 넓은 여백과 큰 제목(One UI) */}
        {(platform === 'android' || page === 'main') && <h1 className="set-large-title">{titles[page]}</h1>}

        <div className="scroll-area set-body">
          {page === 'main' && (
            <>
              <Group footer="홈 화면 빈 곳, 시계, 비움 위젯을 꾹 누르면 바로 바꿀 수 있어요.">
                <Row label="화면 모양" icon={['phone', '#007aff']} value={PLATFORM_NAMES[platform]} onClick={() => setPage('platform')} />
                <Row label="테마" icon={['theme', '#5856d6']} value={THEME_NAMES[settings.theme]} onClick={() => setPage('theme')} />
                <Row label="배경화면" icon={['wallpaper', '#32ade6']} value={wallpaperName(settings.wallpaper)} onClick={() => setPage('wallpaper')} />
              </Group>
              <Group footer="아이폰 브라우저는 진동을 지원하지 않아요.">
                <Row
                  label="진동"
                  icon={['haptics', '#ff2d55']}
                  right={<Switch label="진동" on={settings.haptics} onToggle={() => onChange({ haptics: !settings.haptics })} />}
                />
              </Group>
              <Group>
                <Row label="정보" icon={['info', '#8e8e93']} value={`버전 ${VERSION}`} />
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
    </PlatformCtx.Provider>
  )
}
