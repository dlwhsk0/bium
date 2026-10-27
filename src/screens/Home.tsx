import { useRef, useState } from 'react'
import { BackButton } from '../components/BackButton'
import { Sheet } from '../components/Sheet'
import { periodLabel, type Bium } from '../lib/bium'

interface Props {
  history: Bium[]
  onStart: () => void
  onOpen: (id: string) => void
  notice: string | null
  onExport: () => void
  onImport: (file: File) => void
  onIntro: () => void
  onEditCategories: () => void
  /** 휴대폰 홈 화면으로 */
  onExit: () => void
}

/** 홈에 바로 보이는 지난 비움 수. 나머지는 "모두 보기" 시트에서 — 홈이 한 화면을 넘지 않게. */
const RECENT = 2

function HistoryRow({ b, onOpen }: { b: Bium; onOpen: (id: string) => void }) {
  return (
    <li>
      <button className="list-row" onClick={() => onOpen(b.id)}>
        <span className="list-title">{b.tosses.length}개 비움</span>
        <span className="list-sub">{periodLabel(b)}</span>
      </button>
    </li>
  )
}

export function Home(props: Props) {
  const { history, onStart, onOpen, notice, onExport, onImport, onIntro, onEditCategories, onExit } = props
  const fileInput = useRef<HTMLInputElement>(null)
  const [sheet, setSheet] = useState<'settings' | 'history' | null>(null)
  const close = () => setSheet(null)

  return (
    <main className="screen home">
      <BackButton onClick={onExit} />
      <button className="corner-button" onClick={() => setSheet('settings')} aria-label="설정">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
          <path
            d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.8 1.7 1l.4 2.5h4l.4-2.5c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="intro">
        <img className="intro-icon" src="/icons/package-lg.png" alt="" draggable={false} />
        <h1 className="title">비움</h1>
        <p className="body">
          버릴 물건을 하나씩 넣으면
          <br />
          며칠이 걸려도 대신 세어둘게요
        </p>
      </div>

      {history.length > 0 && (
        <section className="history">
          <ul className="card list">
            {history.slice(0, RECENT).map((b) => (
              <HistoryRow key={b.id} b={b} onOpen={onOpen} />
            ))}
          </ul>
          {history.length > RECENT && (
            <button className="text-button" onClick={() => setSheet('history')}>
              지난 비움 모두 보기 ({history.length})
            </button>
          )}
        </section>
      )}

      <footer className="actions">
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        <button className="cta" onClick={onStart}>
          비움 시작하기
        </button>
      </footer>

      {sheet === 'settings' && (
        <Sheet title="설정" onClose={close}>
          <ul className="sheet-list">
            <li>
              <button onClick={() => (close(), onEditCategories())}>카테고리 편집</button>
            </li>
            <li>
              <button onClick={() => (close(), onIntro())}>앱 소개 다시 보기</button>
            </li>
            <li>
              <button onClick={() => (close(), onExport())} disabled={history.length === 0}>
                백업 파일 저장
              </button>
            </li>
            <li>
              <button onClick={() => fileInput.current?.click()}>백업 불러오기</button>
            </li>
          </ul>
        </Sheet>
      )}

      {sheet === 'history' && (
        <Sheet title="지난 비움" onClose={close}>
          <ul className="list">
            {history.map((b) => (
              <HistoryRow key={b.id} b={b} onOpen={(id) => (close(), onOpen(id))} />
            ))}
          </ul>
        </Sheet>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            close()
            onImport(file)
          }
          e.target.value = '' // 같은 파일을 다시 골라도 onChange가 오게
        }}
      />
    </main>
  )
}
