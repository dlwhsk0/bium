import { useRef } from 'react'
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
}

export function Home({ history, onStart, onOpen, notice, onExport, onImport, onIntro, onEditCategories }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <main className="screen home">
      <div className="intro">
        <img className="intro-icon" src="/icons/wastebasket.png" alt="" draggable={false} />
        <h1 className="title">비움</h1>
        <p className="body">
          버릴 물건을 하나씩 넣으면
          <br />
          며칠이 걸려도 대신 세어둘게요
        </p>
      </div>

      {history.length > 0 && (
        <section className="history">
          <h2 className="caption">지난 비움</h2>
          <ul className="card list">
            {history.map((b) => (
              <li key={b.id}>
                <button className="list-row" onClick={() => onOpen(b.id)}>
                  <span className="list-title">{b.tosses.length}개 비움</span>
                  <span className="list-sub">{periodLabel(b)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="actions">
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        <div className="text-buttons">
          <button className="text-button" onClick={onEditCategories}>
            카테고리 편집
          </button>
          <button className="text-button" onClick={onIntro}>
            앱 소개
          </button>
        </div>
        <div className="text-buttons">
          <button className="text-button" onClick={onExport} disabled={history.length === 0}>
            백업 파일 저장
          </button>
          <button className="text-button" onClick={() => fileInput.current?.click()}>
            백업 불러오기
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = '' // 같은 파일을 다시 골라도 onChange가 오게
            }}
          />
        </div>
        <button className="cta" onClick={onStart}>비움 시작하기</button>
      </footer>
    </main>
  )
}
