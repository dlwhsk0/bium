import { loadSettings } from './storage'

/** 짧은 진동. 설정에서 진동을 끄면 아무것도 안 한다(iOS 사파리는 원래 미지원). */
export function buzz(pattern: number | number[]) {
  if (loadSettings().haptics) navigator.vibrate?.(pattern)
}
