import { useState } from 'react'
import { defaultName, periodLabel, summarize, type Bium } from '../lib/bium'

interface Props {
  history: Bium[]
  onStart: (name: string) => void
  onOpen: (id: string) => void
}

export function Home({ history, onStart, onOpen }: Props) {
  const [name, setName] = useState('')
  const [placeholder] = useState(() => defaultName(Date.now()))

  return (
    <main className="screen home">
      <div className="hero">
        <span className="hero-icon" aria-hidden>🗑️</span>
        <h1 className="brand">비움</h1>
        <p className="tagline">버릴 때마다 톡, 쓰레기통에 던져요</p>
      </div>

      <form
        className="start"
        onSubmit={(e) => {
          e.preventDefault()
          onStart(name)
        }}
      >
        <input
          className="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          maxLength={30}
          aria-label="비움 이름"
        />
        <button className="primary" type="submit">비움 시작</button>
      </form>

      {history.length > 0 && (
        <section className="history">
          <h2>지난 비움</h2>
          <ul>
            {history.map((b) => (
              <li key={b.id}>
                <button className="history-item" onClick={() => onOpen(b.id)}>
                  <span className="history-text">
                    <strong>{b.name}</strong>
                    <small>{periodLabel(b)}</small>
                  </span>
                  <span className="history-total">{summarize(b).total}개</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
