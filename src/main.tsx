import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 저장 공간이 부족할 때 브라우저가 기록(localStorage)을 지우지 않도록 영구 저장을 요청한다.
// 홈 화면에 설치한 앱이면 대개 바로 허용된다. 거절돼도 앱은 그대로 동작.
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
