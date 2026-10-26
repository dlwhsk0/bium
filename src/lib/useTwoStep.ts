import { useEffect, useState } from 'react'

/**
 * 되돌릴 수 없는 버튼용: 한 번 누르면 확인 상태가 되고, 3초 안에 한 번 더 눌러야 실행된다.
 * `press`를 onClick에 걸고 `confirming`으로 문구를 바꾼다.
 */
export function useTwoStep(action: () => void) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(t)
  }, [confirming])

  const press = () => (confirming ? action() : setConfirming(true))
  return { confirming, press }
}
