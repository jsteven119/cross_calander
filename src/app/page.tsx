'use client'

import { useState } from 'react'
import { useCalendarData } from '@/hooks/useCalendarData'
import { YearlyCalendar } from '@/components/YearlyCalendar'

export default function Home() {
  const { data, error, isLoading } = useCalendarData()
  const [lastRefreshed] = useState(new Date())

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent mx-auto" />
          <p className="text-sm text-gray-500">플래너 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-gray-700 font-medium">데이터를 불러올 수 없습니다</p>
          <p className="text-xs text-gray-400">환경변수 설정을 확인해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <YearlyCalendar data={data} lastRefreshed={lastRefreshed} />
    </main>
  )
}
