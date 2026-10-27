import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { seeded } from '../lib/packs'
import { toAvatar } from '../lib/photo'
import {
  DEFAULT_FRIEND,
  loadBurstCount,
  loadFriend,
  loadVentChat,
  saveBurstCount,
  saveFriend,
  saveVentChat,
  type Friend,
  type VentMessage,
} from '../lib/storage'

interface Props {
  onBack: () => void
}

type Message = VentMessage

/** chatting: 톡하는 중 / profile: 친구 프로필 바꾸는 중 / bursting: 말풍선이 사방으로 터지는 중 / burst: 방이 터진 뒤 */
type Phase = 'chatting' | 'profile' | 'bursting' | 'burst'

const MAX_NAME = 10
const BURST_MS = 1100
const DEFAULT_PHOTO = '/icons/wastebasket.png'
// 친구는 먼저 말을 걸지 않는다. 내가 보낼 때마다 이 확률로 리액션을 마음먹는다 — 말하는 중간에도 불쑥.
const REPLY_CHANCE = 0.3
// 보내면 1이 떴다가 이 사이 랜덤한 때에 친구가 읽는다(그때까지 쌓인 1이 한꺼번에 사라짐).
// 리액션은 읽은 뒤에만, 조금 있다가 온다.
const READ_MS: [number, number] = [400, 2000]
const REPLY_AFTER_READ_MS: [number, number] = [300, 800]
const between = ([min, max]: [number, number]) => min + Math.random() * (max - min)

const rollReply = () => Math.random() < REPLY_CHANCE

const markRead = (m: VentMessage): VentMessage => (m.from === 'me' && !m.read ? { ...m, read: true } : m)

/** 리액션 하나 고르기. 바로 전 것(last)과 같은 건 피한다. */
function pickReply(last: number) {
  const r = Math.floor(Math.random() * REPLIES.length)
  return r === last ? (r + 1) % REPLIES.length : r
}
// 찐친 리액션: 무조건 내 편, 같이 욕해준다. 진짜 톡처럼 짧은 것도 섞는다.
const REPLIES = [
  'ㅇㅇ',
  ';;',
  'ㅁㅊ?',
  '아 에바',
  'ㄹㅇ',
  'ㅋㅋㅋㅋㅋ',
  '헐',
  'ㅠㅠ',
  'ㄷㄷ',
  '개에바',
  '???',
  'ㅇㅈ',
  'ㅂㄷㅂㄷ',
  '실화냐',
  '그니까',
  '와',
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
  // 나가기 전까지의 대화는 브라우저에 남아 있어 새로고침해도 이어진다
  const [saved] = useState(loadVentChat)
  const [messages, setMessages] = useState<Message[]>(saved?.messages ?? [])
  const [draft, setDraft] = useState('')
  const [phase, setPhase] = useState<Phase>('chatting')
  const [friend, setFriend] = useState(loadFriend)
  const [count, setCount] = useState(loadBurstCount)
  const [openedAt, setOpenedAt] = useState(() => saved?.openedAt ?? Date.now())
  // 오른쪽 위 메뉴(서랍): 프로필 수정, 방 나가기
  const [menuOpen, setMenuOpen] = useState(false)
  const nextId = useRef(Math.max(-1, ...(saved?.messages ?? []).map((m) => m.id)) + 1)
  const lastReply = useRef(-1)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const burstTimer = useRef<number | null>(null)
  const readTimer = useRef<number | null>(null)
  const replyTimers = useRef<number[]>([])
  // 읽고 나면 리액션할지 (보낸 말 중 하나라도 리액션을 마음먹었으면)
  const wantsReply = useRef(false)

  const stopFriend = () => {
    if (readTimer.current !== null) clearTimeout(readTimer.current)
    readTimer.current = null
    replyTimers.current.forEach(clearTimeout)
    replyTimers.current = []
    wantsReply.current = false
  }

  useEffect(
    () => () => {
      if (burstTimer.current !== null) clearTimeout(burstTimer.current)
      stopFriend()
    },
    [],
  )

  // 말풍선이 바뀔 때마다 저장. 다 비면(방을 나가면) 지운다.
  useEffect(() => {
    saveVentChat(messages.length > 0 ? { openedAt, messages } : null)
  }, [messages, openedAt])

  // 친구가 쌓인 내 말을 한꺼번에 읽는다(1이 사라짐). 리액션을 마음먹었으면 조금 있다 답한다.
  // ref와 setState만 쓰므로 한 번 만들어 두고 계속 쓴다.
  const readAll = useCallback(() => {
    readTimer.current = null
    setMessages((m) => m.map(markRead))
    if (!wantsReply.current) return
    wantsReply.current = false
    replyTimers.current.push(
      window.setTimeout(() => {
        const r = pickReply(lastReply.current)
        lastReply.current = r
        // 답하기 전에 그 사이 새로 보낸 말까지 다 읽는다 — 1이 남은 채로 답이 오지 않게
        setMessages((m) => [...m.map(markRead), { id: nextId.current++, from: 'friend', text: REPLIES[r], at: Date.now() }])
      }, between(REPLY_AFTER_READ_MS)),
    )
  }, [])

  // 새로고침 전에 친구가 안 읽은 말이 있었으면 이어서 읽는다(처음 열 때 한 번)
  useEffect(() => {
    if (saved?.messages.some((m) => m.from === 'me' && !m.read)) {
      readTimer.current = window.setTimeout(readAll, between(READ_MS))
    }
  }, [saved, readAll])

  // 새 말풍선이 생기면 맨 아래로
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  function send() {
    const text = draft.trim()
    if (!text || phase !== 'chatting') return
    setMessages((m) => [...m, { id: nextId.current++, from: 'me', text, at: Date.now(), read: false }])
    setDraft('')
    inputRef.current?.focus()

    if (rollReply()) wantsReply.current = true
    // 친구가 아직 안 읽었으면 그 읽기 타이머에 같이 묶인다
    if (readTimer.current === null) readTimer.current = window.setTimeout(readAll, between(READ_MS))
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
    stopFriend()
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
          <button
            className="cta"
            onClick={() => {
              setOpenedAt(Date.now())
              setPhase('chatting')
            }}
          >
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
                  <span className="msg-meta">
                    {m.from === 'me' && !m.read && <span className="msg-unread">1</span>}
                    <span className="msg-time">{timeLabel(m.at)}</span>
                  </span>
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
