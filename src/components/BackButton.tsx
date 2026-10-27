/** 왼쪽 위 "‹" 뒤로가기. 각 앱에서 휴대폰 홈 화면으로 돌아갈 때 쓴다. */
export function BackButton({ onClick, label = '홈 화면으로', className = 'corner-button left' }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button className={className} onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
