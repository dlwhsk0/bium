import { useRef, type PointerEvent } from 'react'

const HOLD_MS = 500
/** 이만큼 움직이면 스크롤로 보고 꾹 누르기를 취소한다 */
const MOVE_TOLERANCE = 10

/**
 * 짧게 누르면 onClick, 꾹 누르면 onLongPress. 꾹 누른 뒤 손을 떼도 onClick은 오지 않는다.
 * 반환값을 버튼에 그대로 펼쳐 쓴다: `<button {...useLongPress(...)}>`
 */
export function useLongPress(onClick: () => void, onLongPress: () => void) {
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    start.current = null
  }

  return {
    onPointerDown: (e: PointerEvent) => {
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(() => {
        fired.current = true
        timer.current = null
        navigator.vibrate?.(20)
        onLongPress()
      }, HOLD_MS)
    },
    onPointerMove: (e: PointerEvent) => {
      if (!start.current) return
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE) cancel()
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClick: () => {
      if (fired.current) {
        fired.current = false
        return
      }
      onClick()
    },
    // 안드로이드 길게 누르기 메뉴, iOS 미리보기가 뜨지 않게
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  }
}
