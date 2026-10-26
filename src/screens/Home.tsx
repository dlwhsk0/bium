import { periodLabel, type Bium } from '../lib/bium'

interface Props {
  history: Bium[]
  onStart: () => void
  onOpen: (id: string) => void
}

export function Home({ history, onStart, onOpen }: Props) {
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
        <button className="cta" onClick={onStart}>비움 시작하기</button>
      </footer>
    </main>
  )
}
