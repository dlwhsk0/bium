import { useEffect, useState } from 'react'
import { finish, startBium, toss, undo, type Bium } from './lib/bium'
import { loadActive, loadHistory, saveActive, saveHistory } from './lib/storage'
import { Active } from './screens/Active'
import { Home } from './screens/Home'
import { Result } from './screens/Result'

type View = { kind: 'home' } | { kind: 'result'; id: string }

export default function App() {
  const [active, setActive] = useState<Bium | null>(loadActive)
  const [history, setHistory] = useState<Bium[]>(loadHistory)
  const [view, setView] = useState<View>({ kind: 'home' })

  useEffect(() => saveActive(active), [active])
  useEffect(() => saveHistory(history), [history])

  if (active) {
    return (
      <Active
        bium={active}
        onToss={(c) => setActive((b) => b && toss(b, c))}
        onUndo={() => setActive((b) => b && undo(b))}
        onFinish={() => {
          const done = finish(active)
          setHistory((h) => [done, ...h])
          setActive(null)
          setView({ kind: 'result', id: done.id })
        }}
      />
    )
  }

  const opened = view.kind === 'result' ? history.find((b) => b.id === view.id) : undefined
  if (opened) {
    return (
      <Result
        bium={opened}
        onClose={() => setView({ kind: 'home' })}
        onDelete={() => {
          setHistory((h) => h.filter((b) => b.id !== opened.id))
          setView({ kind: 'home' })
        }}
      />
    )
  }

  return (
    <Home
      history={history}
      onStart={() => setActive(startBium())}
      onOpen={(id) => setView({ kind: 'result', id })}
    />
  )
}
