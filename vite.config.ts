import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Vercel 루트 도메인(bium-app.vercel.app)으로 서빙하므로 base는 기본 '/'.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: '비움',
        short_name: '비움',
        description: '방 청소하며 버리는 물건을 하나씩 넣어 세어두는 앱',
        theme_color: '#f2f4f6',
        background_color: '#f2f4f6',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // 아이콘이 가운데 60% 안에 있어 마스크로 잘려도 안전하다
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 3D 아이콘(public/icons)까지 미리 받아둬서 오프라인에서도 쌓이는 모습이 보인다
        globPatterns: ['**/*.{js,css,html,png}'],
        runtimeCaching: [
          {
            // Pretendard 글꼴(CSS + 서브셋 woff2)은 CDN에서 받으므로 한 번 받은 건 캐시해 둔다
            urlPattern: ({ url }) => url.hostname === 'cdn.jsdelivr.net',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
