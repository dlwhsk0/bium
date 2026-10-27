import type { CSSProperties } from 'react'
import { EMOJI } from '../lib/emoji'

/** 기기 이모지로 그리는 아이콘. 크기는 className의 font-size로 정한다. */
export function Emoji({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={className ? `emoji ${className}` : 'emoji'} style={style} aria-hidden>
      {EMOJI[name] ?? '❔'}
    </span>
  )
}
