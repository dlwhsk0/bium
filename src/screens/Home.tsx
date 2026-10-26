import { periodLabel, type Bium } from '../lib/bium'
import { CATEGORIES } from '../lib/categories'

interface Props {
  history: Bium[]
  onStart: () => void
  onOpen: (id: string) => void
}

export function Home({ history, onStart, onOpen }: Props) {
  return (
    <main className="screen home">
      <div className="hero">
        <h1 className="brand">비움</h1>
        <p className="tagline">버릴 물건을 하나씩<br />분리수거함에 넣어요</p>
        <div className="mini-yard" aria-hidden>
          {CATEGORIES.map((c) => (
            <span key={c.key} className={`mini-bin bin-${c.key}`}>
              <img src={`/icons/${c.icons[0]}.png`} alt="" draggable={false} />
              <span className="mini-front">{c.label}</span>
            </span>
          ))}
        </div>
      </div>

      <button className="primary" onClick={onStart}>비움 시작</button>

      {history.length > 0 && (
        <section className="history">
          <h2>지난 비움</h2>
          <ul>
            {history.map((b) => (
              <li key={b.id}>
                <button className="history-item" onClick={() => onOpen(b.id)}>
                  <span className="history-period">{periodLabel(b)}</span>
                  <span className="history-total">{b.tosses.length}개</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
