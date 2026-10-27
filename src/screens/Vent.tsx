import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { seeded } from '../lib/packs'
import { loadBurstCount, saveBurstCount } from '../lib/storage'

interface Props {
  onBack: () => void
}

interface Message {
  id: number
  from: 'me' | 'friend'
  text: string
  at: number
}

/** chatting: 톡하는 중 / bursting: 말풍선이 사방으로 터지는 중 / burst: 방이 터진 뒤 */
type Phase = 'chatting' | 'bursting' | 'burst'

const FRIEND = '비움이'
const GREETING = '무슨 일 있어? 다 말해봐'
// 하소연을 끊지 않게, 말을 멈추고 잠깐 있으면 친구가 짧게 맞장구친다
const LISTEN_MS = 2500
const TYPING_MS = 1200
const BURST_MS = 1100
const REPLIES = [
  '헐',
  '진짜?',
  '와 그건 진짜 아니다',
  '에휴 고생했다',
  '토닥토닥',
  '말 다 해 다 들어줄게',
  '완전 공감',
  '속상했겠다',
  '그래서 어떻게 됐어?',
  '와 나였어도 화났다',
  '괜찮아 니 잘못 아니야',
  '오늘은 푹 쉬어',
  '더 해 더 해',
  '아 진짜 열받네',
]

const timeLabel = (t: number) => {
  const d = new Date(t)
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function Vent({ onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => [{ id: 0, from: 'friend', text: GREETING, at: Date.now() }])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [phase, setPhase] = useState<Phase>('chatting')
  const [count, setCount] = useState(loadBurstCount)
  const nextId = useRef(1)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timers = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  // 새 말풍선이 생기면 맨 아래로
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  function push(from: Message['from'], text: string) {
    setMessages((m) => [...m, { id: nextId.current++, from, text, at: Date.now() }])
  }

  function send() {
    const text = draft.trim()
    if (!text || phase !== 'chatting') return
    push('me', text)
    setDraft('')
    inputRef.current?.focus()

    // 말을 이어가면 친구는 다시 기다린다
    clearTimers()
    setTyping(false)
    later(() => {
      setTyping(true)
      later(() => {
        setTyping(false)
        push('friend', REPLIES[Math.floor(Math.random() * REPLIES.length)])
      }, TYPING_MS)
    }, LISTEN_MS)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 조합 중 엔터는 글자 확정용이라 무시(안 그러면 두 번 보내진다). Shift+엔터는 줄바꿈.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  function burst() {
    if (phase !== 'chatting') return
    clearTimers()
    setTyping(false)
    ;(document.activeElement as HTMLElement | null)?.blur()
    navigator.vibrate?.([30, 30, 60])
    setPhase('bursting')
    later(() => {
      setMessages([]) // 했던 말은 여기서 사라진다
      setCount((c) => {
        saveBurstCount(c + 1)
        return c + 1
      })
      setPhase('burst')
    }, BURST_MS)
  }

  function reopen() {
    nextId.current = 1
    setMessages([{ id: 0, from: 'friend', text: GREETING, at: Date.now() }])
    setPhase('chatting')
  }

  const said = messages.some((m) => m.from === 'me')

  if (phase === 'burst') {
    return (
      <main className="screen vent-burst">
        <div className="intro">
          <img className="intro-icon burst-pop" src="/icons/collision.png" alt="" draggable={false} />
          <h1 className="title">방이 터졌어요</h1>
          <p className="body">
            했던 말은 하나도 남지 않았어요.
            <br />
            지금까지 방 {count}개를 터트렸어요.
          </p>
        </div>
        <footer className="actions">
          <button className="text-button" onClick={onBack}>
            돌아가기
          </button>
          <button className="cta" onClick={reopen}>
            새 방 열기
          </button>
        </footer>
      </main>
    )
  }

  return (
    <main className={phase === 'bursting' ? 'chat shaking' : 'chat'}>
      <header className="chat-bar">
        <button className="chat-back" onClick={onBack} aria-label="돌아가기" disabled={phase !== 'chatting'}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="chat-title">{FRIEND}</span>
        <button className="chat-burst" onClick={burst} disabled={!said || phase !== 'chatting'}>
          <img src="/icons/collision.png" alt="" draggable={false} />
          터트리기
        </button>
      </header>

      <div ref={listRef} className="chat-list" aria-live="polite">
        {messages.map((m, i) => {
          const showFriend = m.from === 'friend' && messages[i - 1]?.from !== 'friend'
          const style = {
            '--bx': `${(seeded(m.id + 1) - 0.5) * 700}px`,
            '--by': `${(seeded(m.id + 2) - 0.6) * 900}px`,
            '--br': `${(seeded(m.id + 3) - 0.5) * 720}deg`,
            animationDelay: `${seeded(m.id + 4) * 150}ms`,
          } as CSSProperties
          return (
            <div key={m.id} className={`msg ${m.from}`} style={style}>
              {m.from === 'friend' &&
                (showFriend ? (
                  <img className="msg-avatar" src="/icons/wastebasket.png" alt="" draggable={false} />
                ) : (
                  <span className="msg-avatar" />
                ))}
              <div className="msg-body">
                {showFriend && <span className="msg-name">{FRIEND}</span>}
                <div className="msg-line">
                  <p className="bubble">{m.text}</p>
                  <span className="msg-time">{timeLabel(m.at)}</span>
                </div>
              </div>
            </div>
          )
        })}
        {typing && (
          <div className="msg friend">
            <span className="msg-avatar" />
            <div className="msg-body">
              <p className="bubble typing" aria-label={`${FRIEND} 입력 중`}>
                <span />
                <span />
                <span />
              </p>
            </div>
          </div>
        )}
        {phase === 'bursting' && <img className="burst-flash" src="/icons/collision.png" alt="" draggable={false} />}
      </div>

      <footer className="chat-input">
        <textarea
          ref={inputRef}
          className="chat-text"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="하고 싶은 말 다 해"
          enterKeyHint="send"
          aria-label="메시지"
          readOnly={phase !== 'chatting'}
        />
        <button className="chat-send" onClick={send} disabled={!draft.trim() || phase !== 'chatting'}>
          전송
        </button>
      </footer>
    </main>
  )
}
