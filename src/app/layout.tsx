import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GTM 캘린더 | 전 권역 통합 뷰',
  description: '여러 팀·권역의 GTM 활동을 실시간으로 공유하는 통합 캘린더',
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
