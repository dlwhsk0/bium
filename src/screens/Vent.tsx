import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { seeded } from '../lib/packs'
import { toAvatar } from '../lib/photo'
import { DEFAULT_FRIEND, loadBurstCount, loadFriend, saveBurstCount, saveFriend, type Friend } from '../lib/storage'

interface Props {
  onBack: () => void
}

interface Message {
  id: number
  from: 'me' | 'friend'
  text: string
  at: number
}

/** chatting: 톡하는 중 / profile: 친구 프로필 바꾸는 중 / bursting: 말풍선이 사방으로 터지는 중 / burst: 방이 터진 뒤 */
type Phase = 'chatting' | 'profile' | 'bursting' | 'burst'

const MAX_NAME = 10
const BURST_MS = 1100
const DEFAULT_PHOTO = '/icons/wastebasket.png'
// 친구는 먼저 말을 걸지 않는다. 내가 보낼 때마다 이 확률로 바로 끼어든다 — 말하는 중간에도 불쑥.
const REPLY_CHANCE = 0.5
// 찐친 리액션: 무조건 내 편, 같이 욕해준다
const REPLIES = [
  '와 미친 거 아냐?',
  'ㅅㅂ 듣는 내가 다 빡치네',
  '걔가 이상한 거야 100%',
  '니가 맞아 무조건',
  '개념 어디다 팔아먹었대',
  '와 진짜 개빡친다',
  '미친놈 아니야 그거?',
  '내가 가서 한 대 쳐줘?',
  'ㄹㅇ 개어이없네',
  '넌 잘못 1도 없어',
  '그 사람 인생 왜 그렇게 산대',
  '와 개소리를 하고 있네',
  '아니 그걸 왜 너한테 그래?',
  'ㅋㅋ 어이가 없네 진짜',
  '나 지금 개열받음',
  '헐 미쳤다 미쳤어',
  '아 진짜 ㅈ같네',
  '무조건 니 편이야',
  '그딴 말 신경 쓰지 마 걔가 쓰레기야',
  '와 나였으면 진짜 뒤집었다',
  '더 해 더 해 다 들어줄게',
  '이건 니가 화날 만했어',
]

const timeLabel = (t: number) => {
  const d = new Date(t)
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`
}

const dateLabel = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일`
}

/** 친구 프로필 사진과 이름 정하기 */
function ProfileEditor({ friend, onSave, onCancel }: { friend: Friend; onSave: (f: Friend) => void; onCancel: () => void }) {
  const [name, setName] = useState(friend.name)
  const [photo, setPhoto] = useState(friend.photo)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <main className="screen profile">
      <header className="summary">
        <h1 className="title">친구 프로필</h1>
        <p className="body">하소연을 들어줄 친구의 사진과 이름을 정해요.</p>
      </header>

      <div className="profile-edit">
        <button className="profile-photo" onClick={() => fileInput.current?.click()} aria-label="프로필 사진 고르기">
          <img src={photo ?? DEFAULT_PHOTO} alt="" draggable={false} className={photo ? 'is-photo' : ''} />
        </button>
        <div className="text-buttons">
          <button className="text-button" onClick={() => fileInput.current?.click()}>
            사진 고르기
          </button>
          <button className="text-button" onClick={() => setPhoto(null)} disabled={!photo}>
            기본 그림으로
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              setPhoto(await toAvatar(file))
              setError(null)
            } catch {
              setError('이 사진은 쓸 수 없어요. 다른 사진을 골라주세요.')
            }
          }}
        />
        {error && <p className="notice">{error}</p>}
        <input
          className="label-input profile-name"
          value={name}
          maxLength={MAX_NAME}
          placeholder={DEFAULT_FRIEND.name}
          aria-label="친구 이름"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <footer className="actions">
        <button className="text-button" onClick={onCancel}>
          취소
        </button>
        <button className="cta" onClick={() => onSave({ name: name.trim() || DEFAULT_FRIEND.name, photo })}>
          완료
        </button>
      </footer>
    </main>
  )
}

export function Vent({ onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [phase, setPhase] = useState<Phase>('chatting')
  const [friend, setFriend] = useState(loadFriend)
  const [count, setCount] = useState(loadBurstCount)
  const [openedAt] = useState(() => Date.now())
  // 오른쪽 위 메뉴(서랍): 프로필 수정, 방 나가기
  const [menuOpen, setMenuOpen] = useState(false)
  const nextId = useRef(0)
  const lastReply = useRef(-1)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const burstTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (burstTimer.current !== null) clearTimeout(burstTimer.current)
    },
    [],
  )

  // 새 말풍선이 생기면 맨 아래로
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  function send() {
    const text = draft.trim()
    if (!text || phase !== 'chatting') return
    const now = Date.now()
    const sent: Message[] = [{ id: nextId.current++, from: 'me', text, at: now }]
    if (Math.random() < REPLY_CHANCE) {
      // 같은 리액션이 연달아 나오지 않게
      let r = Math.floor(Math.random() * REPLIES.length)
      if (r === lastReply.current) r = (r + 1) % REPLIES.length
      lastReply.current = r
      sent.push({ id: nextId.current++, from: 'friend', text: REPLIES[r], at: now })
    }
    setMessages((m) => [...m, ...sent])
    setDraft('')
    inputRef.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 조합 중 엔터는 글자 확정용이라 무시(안 그러면 두 번 보내진다). Shift+엔터는 줄바꿈.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  /** 방 나가기: 한 말이 있으면 방을 터트리고, 없으면 그냥 나간다 */
  function leave() {
    setMenuOpen(false)
    if (messages.length === 0) onBack()
    else burst()
  }

  function burst() {
    if (phase !== 'chatting') return
    ;(document.activeElement as HTMLElement | null)?.blur()
    navigator.vibrate?.([30, 30, 60])
    setPhase('bursting')
    burstTimer.current = window.setTimeout(() => {
      setMessages([]) // 했던 말은 여기서 사라진다
      setCount((c) => {
        saveBurstCount(c + 1)
        return c + 1
      })
      setPhase('burst')
    }, BURST_MS)
  }

  if (phase === 'profile') {
    return (
      <ProfileEditor
        friend={friend}
        onCancel={() => setPhase('chatting')}
        onSave={(f) => {
          setFriend(f)
          saveFriend(f)
          setPhase('chatting')
        }}
      />
    )
  }

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
          <button className="cta" onClick={() => setPhase('chatting')}>
            새 방 열기
          </button>
        </footer>
      </main>
    )
  }

  const avatar = friend.photo ?? DEFAULT_PHOTO
  const openProfile = () => phase === 'chatting' && setPhase('profile')

  return (
    <main className={phase === 'bursting' ? 'chat shaking' : 'chat'}>
      <header className="chat-bar">
        <button className="chat-back" onClick={onBack} aria-label="돌아가기" disabled={phase !== 'chatting'}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="chat-title" onClick={openProfile} aria-label={`${friend.name}, 프로필 바꾸기`}>
          <img className={friend.photo ? 'chat-title-photo is-photo' : 'chat-title-photo'} src={avatar} alt="" draggable={false} />
          <span>{friend.name}</span>
        </button>
        <button
          className="chat-menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="메뉴"
          aria-expanded={menuOpen}
          disabled={phase !== 'chatting'}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <nav className="drawer" onClick={(e) => e.stopPropagation()} aria-label="채팅방 메뉴">
            <div className="drawer-friend">
              <img className={friend.photo ? 'drawer-photo is-photo' : 'drawer-photo'} src={avatar} alt="" draggable={false} />
              <span className="drawer-name">{friend.name}</span>
            </div>
            <button
              className="drawer-item"
              onClick={() => {
                setMenuOpen(false)
                openProfile()
              }}
            >
              프로필 수정
            </button>
            <button className="drawer-item danger" onClick={leave}>
              방 나가기
              {messages.length > 0 && <span className="drawer-hint">한 말은 방과 함께 터져서 사라져요</span>}
            </button>
          </nav>
        </div>
      )}

      <div ref={listRef} className="chat-list" aria-live="polite">
        <p className="chat-date">{dateLabel(openedAt)}</p>
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
                  <button className="msg-avatar-button" onClick={openProfile} aria-label={`${friend.name} 프로필 바꾸기`}>
                    <img className={friend.photo ? 'msg-avatar is-photo' : 'msg-avatar'} src={avatar} alt="" draggable={false} />
                  </button>
                ) : (
                  <span className="msg-avatar" />
                ))}
              <div className="msg-body">
                {showFriend && <span className="msg-name">{friend.name}</span>}
                <div className="msg-line">
                  <p className="bubble">{m.text}</p>
                  <span className="msg-time">{timeLabel(m.at)}</span>
                </div>
              </div>
            </div>
          )
        })}
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
