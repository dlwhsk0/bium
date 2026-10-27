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
// 친구는 먼저 말을 걸지 않는다. 내가 보낼 때마다 이 확률로 리액션을 마음먹는다 — 말하는 중간에도 불쑥.
const REPLY_CHANCE = 0.25
// 이만큼 말하기 전엔 끼어들지 않는다 — 방을 연 첫마디부터, 리액션한 직후에도 한동안은 그냥 들어준다
const QUIET_MESSAGES = 4
// 보낸 말의 1은 보통 친구가 답하기로 했을 때만 사라진다. 답하기로 하면 이 사이 랜덤한 때에
// 읽고(쌓인 1이 한꺼번에 사라짐) 곧바로 답한다. 가끔은 읽기만 한다(읽씹).
const IGNORE_CHANCE = 0.1
// 그 자리에서 반응하지 않았는데 내가 말을 멈추면, 이만큼 지나서 결국 읽는다(1이 영영 남지 않게).
// 그때는 IDLE_REPLY_CHANCE로 답하고, 아니면 읽기만 한다.
const IDLE_MS: [number, number] = [4000, 8000]
const IDLE_REPLY_CHANCE = 0.6
// 내 말에 이런 말이 들어가면(띄어쓰기 무시) 무조건 빨리 읽고 아니라고 해명한다
const NUDGE_WORDS = ['읽씹', '왜안읽어', '빨리읽어']
const isNudge = (text: string) => {
  const compact = text.replace(/\s+/g, '')
  return NUDGE_WORDS.some((w) => compact.includes(w))
}
const DENY_READ_MS: [number, number] = [300, 900]
// 안정형 말투로 차분하게. 문구 안의 줄바꿈(\n)은 다음 말풍선으로 나눠 보낸다.
const DENIALS = [
  '읽씹 아니야 읽고 있었어.',
  '읽씹 아니야 읽고 있었어.\n천천히 다 말해',
  'ㄴㄴ 읽씹 아냐 계속해',
  'ㄴㄴ 미친놈들이네 걔네',
  'ㄴㄴ 미친놈들이네 걔네\n그래서 어떻게 됐어?',
  '아니 읽씹 아님',
]
// 2차 말풍선은 1차 뒤 이 사이에 이어서 온다
const NEXT_BUBBLE_MS: [number, number] = [400, 700]
const READ_MS: [number, number] = [400, 2000]
const REPLY_AFTER_READ_MS: [number, number] = [300, 800]
const between = ([min, max]: [number, number]) => min + Math.random() * (max - min)

const rollReply = () => Math.random() < REPLY_CHANCE
const rollIgnore = () => Math.random() < IGNORE_CHANCE
const rollIdleReply = () => Math.random() < IDLE_REPLY_CHANCE
const pickDenial = () => DENIALS[Math.floor(Math.random() * DENIALS.length)]

const markRead = (m: VentMessage): VentMessage => (m.from === 'me' && !m.read ? { ...m, read: true } : m)

/** 리액션 하나 고르기. 바로 전 것(last)과 같은 건 피한다. */
function pickReply(last: number) {
  const r = Math.floor(Math.random() * REPLIES.length)
  return r === last ? (r + 1) % REPLIES.length : r
}
// 찐친 리액션: 무조건 내 편, 같이 욕해준다. 진짜 톡처럼 짧은 것도 섞는다.
// 줄바꿈(\n)이 있으면 다음 말풍선으로 한마디 더 — 한마디만 하면 정 없으니까.
const REPLIES = [
  'ㅇㅇ',
  ';;',
  'ㅁㅊ?',
  'ㅁㅊ?\n걔 제정신이야?',
  '아 에바',
  'ㄹㅇ',
  'ㅋㅋㅋㅋㅋ',
  '헐',
  '헐\n그래서 어떻게 됐는데',
  'ㅠㅠ',
  'ㅠㅠ\n오늘 진짜 고생했다',
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
  '니가 맞아 무조건\n흔들리지 마',
  '개념 어디다 팔아먹었대',
  '와 진짜 개빡친다',
  '미친놈 아니야 그거?',
  '내가 가서 한 대 쳐줘?\n진심임',
  'ㄹㅇ 개어이없네',
  '넌 잘못 1도 없어',
  '넌 잘못 1도 없어\n자책하지 마 진짜로',
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
  '이건 니가 화날 만했어\n화내도 돼',
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

/** 프로필 사진. 사진이 없으면 기본 사람 실루엣. */
function Avatar({ photo, className }: { photo: string | null; className: string }) {
  if (photo) return <img className={`${className} is-photo`} src={photo} alt="" draggable={false} />
  return (
    <span className={`${className} default-avatar`} aria-hidden>
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="9.5" r="4.2" fill="currentColor" />
        <path d="M3.5 22c0-4.6 3.8-7.3 8.5-7.3s8.5 2.7 8.5 7.3z" fill="currentColor" />
      </svg>
    </span>
  )
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
          <Avatar photo={photo} className="profile-avatar" />
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
  const [confirmLeave, setConfirmLeave] = useState(false)
  const nextId = useRef(Math.max(-1, ...(saved?.messages ?? []).map((m) => m.id)) + 1)
  const lastReply = useRef(-1)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const burstTimer = useRef<number | null>(null)
  const readTimer = useRef<number | null>(null)
  const replyTimers = useRef<number[]>([])
  // 읽고 나면 리액션할지 (보낸 말 중 하나라도 리액션을 마음먹었으면)
  const wantsReply = useRef(false)
  // 이번에 할 답. null이면 REPLIES에서 랜덤(읽씹 해명은 미리 정해 둔다)
  const replyText = useRef<string | null>(null)
  // 마지막 리액션(또는 방을 연 뒤)부터 내가 보낸 말 수
  const sinceReply = useRef(0)
  // 말을 멈췄을 때 결국 읽기
  const idleTimer = useRef<number | null>(null)

  const stopFriend = () => {
    if (readTimer.current !== null) clearTimeout(readTimer.current)
    readTimer.current = null
    replyTimers.current.forEach(clearTimeout)
    replyTimers.current = []
    wantsReply.current = false
    replyText.current = null
    sinceReply.current = 0
    if (idleTimer.current !== null) clearTimeout(idleTimer.current)
    idleTimer.current = null
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

  // 친구가 쌓인 내 말을 한꺼번에 읽는다(1이 사라짐). 답하기로 했으면 조금 있다 답하고, 아니면 읽씹.
  // ref와 setState만 쓰므로 한 번 만들어 두고 계속 쓴다.
  const friendReads = useCallback(() => {
    readTimer.current = null
    setMessages((m) => m.map(markRead))
    if (!wantsReply.current) return
    wantsReply.current = false
    replyTimers.current.push(
      window.setTimeout(() => {
        let text = replyText.current
        replyText.current = null
        if (text === null) {
          const r = pickReply(lastReply.current)
          lastReply.current = r
          text = REPLIES[r]
        }
        // 줄바꿈마다 말풍선을 나눠, 첫 말풍선은 바로 나머지는 조금씩 이어서 보낸다
        const [first, ...rest] = text.split('\n').filter((line) => line.trim())
        // 답하기 전에 그 사이 새로 보낸 말까지 다 읽는다 — 1이 남은 채로 답이 오지 않게
        setMessages((m) => [...m.map(markRead), { id: nextId.current++, from: 'friend', text: first, at: Date.now() }])
        let delay = 0
        for (const line of rest) {
          delay += between(NEXT_BUBBLE_MS)
          replyTimers.current.push(
            window.setTimeout(() => {
              setMessages((m) => [...m.map(markRead), { id: nextId.current++, from: 'friend', text: line, at: Date.now() }])
            }, delay),
          )
        }
      }, between(REPLY_AFTER_READ_MS)),
    )
  }, [])

  // 말을 멈춘 채 시간이 지나면 남은 말을 읽는다. 답할지 읽씹할지는 이때 정한다.
  const readWhenIdle = useCallback(() => {
    idleTimer.current = null
    if (readTimer.current !== null) return
    if (rollIdleReply()) {
      wantsReply.current = true
      sinceReply.current = 0
    }
    friendReads()
  }, [friendReads])

  // 새로고침 전에 친구가 안 읽은 말이 있었으면, 말을 멈춘 것으로 보고 이어서 읽는다(처음 열 때 한 번)
  useEffect(() => {
    if (saved?.messages.some((m) => m.from === 'me' && !m.read)) {
      idleTimer.current = window.setTimeout(readWhenIdle, between(IDLE_MS))
    }
  }, [saved, readWhenIdle])

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

    sinceReply.current++
    if (idleTimer.current !== null) clearTimeout(idleTimer.current)
    idleTimer.current = null

    // '읽씹', '왜 안 읽어', '빨리 읽어'면 무조건 빨리 읽고 아니라고 한다(조용히 들어주는 중이어도)
    if (isNudge(text)) {
      wantsReply.current = true
      replyText.current = pickDenial()
      sinceReply.current = 0
      if (readTimer.current !== null) clearTimeout(readTimer.current)
      readTimer.current = window.setTimeout(friendReads, between(DENY_READ_MS))
      return
    }

    // 이미 읽으려는 중이면 이번 말도 그때 같이 읽힌다
    if (readTimer.current !== null) return
    if (sinceReply.current > QUIET_MESSAGES) {
      if (rollReply()) {
        wantsReply.current = true
        sinceReply.current = 0
        readTimer.current = window.setTimeout(friendReads, between(READ_MS))
        return
      }
      if (rollIgnore()) {
        // 읽씹: 읽기만 하고 답은 안 한다
        readTimer.current = window.setTimeout(friendReads, between(READ_MS))
        return
      }
    }
    // 이번엔 반응하지 않았다 — 말을 멈추면 결국 읽는다
    idleTimer.current = window.setTimeout(readWhenIdle, between(IDLE_MS))
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
    setConfirmLeave(false)
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
          <Avatar photo={friend.photo} className="chat-title-photo" />
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
          <nav className="drawer" onClick={(e) => e.stopPropagation()} aria-label="채팅방 서랍">
            <h2 className="drawer-title">채팅방 서랍</h2>

            <section className="drawer-section">
              <h3 className="drawer-label">
                대화상대 <span>2</span>
              </h3>
              <button
                className="member"
                onClick={() => {
                  setMenuOpen(false)
                  openProfile()
                }}
              >
                <Avatar photo={friend.photo} className="member-photo" />
                <span className="member-name">{friend.name}</span>
                <span className="member-action">프로필 수정</span>
              </button>
              <div className="member">
                <Avatar photo={null} className="member-photo" />
                <span className="member-badge">나</span>
              </div>
            </section>

            <footer className="drawer-bottom">
              <button className="drawer-icon-button" onClick={() => (messages.length ? setConfirmLeave(true) : leave())} aria-label="채팅방 나가기">
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
                  <path
                    d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </footer>
          </nav>
        </div>
      )}

      {confirmLeave && (
        <div className="dialog-backdrop" onClick={() => setConfirmLeave(false)}>
          <div className="dialog" role="alertdialog" aria-labelledby="leave-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="leave-title" className="dialog-title">
              채팅방 나가기
            </h2>
            <p className="dialog-body">나가기를 하면 대화 내용이 방과 함께 터져서 모두 사라져요.</p>
            <div className="dialog-actions">
              <button onClick={() => setConfirmLeave(false)}>취소</button>
              <button className="dialog-confirm" onClick={leave}>
                나가기
              </button>
            </div>
          </div>
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
            <div key={m.id} className={`msg ${m.from}${messages[i - 1] && messages[i - 1].from !== m.from ? ' turn' : ''}`} style={style}>
              {m.from === 'friend' &&
                (showFriend ? (
                  <button className="msg-avatar-button" onClick={openProfile} aria-label={`${friend.name} 프로필 바꾸기`}>
                    <Avatar photo={friend.photo} className="msg-avatar" />
                  </button>
                ) : (
                  <span className="msg-avatar" />
                ))}
              <div className="msg-body">
                {showFriend && <span className="msg-name">{friend.name}</span>}
                <div className="msg-line">
                  <p className={messages[i - 1]?.from !== m.from ? 'bubble tail' : 'bubble'}>{m.text}</p>
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
