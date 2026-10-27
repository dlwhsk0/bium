import type { HTMLAttributes } from 'react'
import type { Platform } from '../lib/platform'

interface Props {
  platform: Platform
  now: Date
  clock24: boolean
  /** 캘린더 일정 자리 / 날짜 아래 한 줄: 비우는 중 개수 또는 한마디 */
  note: string
  /** 꾹 누르기(시간 형식) 핸들러를 그대로 붙인다 */
  press: HTMLAttributes<HTMLElement>
}

const pad = (n: number) => String(n).padStart(2, '0')
const WEEK = '일월화수목금토'

/** 시:분. 12시간제면 오전/오후를 따로 돌려준다. */
function timeParts(d: Date, h24: boolean) {
  if (h24) return { ampm: '', time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
  return { ampm: d.getHours() < 12 ? '오전' : '오후', time: `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}` }
}

/**
 * 아이폰: 실제 아이폰 기본 위젯처럼 작은 위젯 두 개 — 아날로그 시계(주황 초침, 서울)와 캘린더(빨간 요일, 큰 날짜, 일정 자리).
 * 아이폰 홈 화면에는 큰 숫자 시계 위젯이 없다.
 */
function IosWidgets({ now, clock24, note, press }: Omit<Props, 'platform'>) {
  const h = now.getHours() % 12
  const m = now.getMinutes()
  const s = now.getSeconds()
  const hourDeg = h * 30 + m * 0.5
  const minuteDeg = m * 6 + s * 0.1
  const secondDeg = s * 6
  const { ampm, time } = timeParts(now, clock24)

  return (
    <div className="ios-widgets">
      <section className="ios-widget clock-face-widget" aria-label={`서울 ${ampm} ${time}, 꾹 누르면 시간 형식`} {...press}>
        <svg viewBox="0 0 100 100" className="clock-face" aria-hidden>
          <circle cx="50" cy="50" r="48" className="clock-dial" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = ((i + 1) * 30 * Math.PI) / 180
            return (
              <text key={i} x={50 + Math.sin(a) * 38} y={50 - Math.cos(a) * 38} className="clock-num" textAnchor="middle" dominantBaseline="central">
                {i + 1}
              </text>
            )
          })}
          <text x="50" y="31" className="clock-city" textAnchor="middle">
            서울
          </text>
          <text x="50" y="70" className="clock-digital" textAnchor="middle">
            {ampm ? `${ampm} ${time}` : time}
          </text>
          <line x1="50" y1="50" x2="50" y2="27" className="clock-hand hour" transform={`rotate(${hourDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="15" className="clock-hand minute" transform={`rotate(${minuteDeg} 50 50)`} />
          <line x1="50" y1="56" x2="50" y2="11" className="clock-hand second" transform={`rotate(${secondDeg} 50 50)`} />
          <circle cx="50" cy="50" r="2.4" className="clock-pin" />
        </svg>
      </section>
      <section className="ios-widget calendar-widget" aria-label="오늘">
        <p className="cal-weekday">{WEEK[now.getDay()]}요일</p>
        <p className="cal-day">{now.getDate()}</p>
        <p className="cal-event">{note}</p>
      </section>
    </div>
  )
}

/** 갤럭시: 카드 없이 배경화면 위에 큰 숫자 시계 + "10월 27일 (화)" (One UI 홈 화면 시계) */
function GalaxyClock({ now, clock24, note, press }: Omit<Props, 'platform'>) {
  const { ampm, time } = timeParts(now, clock24)
  return (
    <section className="galaxy-clock" aria-label={`${ampm} ${time}, 꾹 누르면 시간 형식`} {...press}>
      <p className="galaxy-time">
        {ampm && <span className="galaxy-ampm">{ampm}</span>}
        {time}
      </p>
      <p className="galaxy-date">
        {now.getMonth() + 1}월 {now.getDate()}일 ({WEEK[now.getDay()]})
      </p>
      <p className="galaxy-note">{note}</p>
    </section>
  )
}

export function ClockWidget(props: Props) {
  return props.platform === 'ios' ? <IosWidgets {...props} /> : <GalaxyClock {...props} />
}
