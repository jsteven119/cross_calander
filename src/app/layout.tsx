import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '제품 캘린더 | 실시간 연간 플래너',
  description: '팀 실시간 공유 제품/마케팅 연간 플래너',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
