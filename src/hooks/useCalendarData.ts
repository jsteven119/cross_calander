'use client'

import useSWR from 'swr'
import { useEffect, useRef } from 'react'
import type { GTMData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useCalendarData() {
  const { data, error, isLoading, mutate } = useSWR<GTMData>(
    '/api/calendar',
    fetcher,
    { refreshInterval: 60_000 }
  )

  const mutateRef = useRef(mutate)
  mutateRef.current = mutate

  useEffect(() => {
    const es = new EventSource('/api/sse')
    es.addEventListener('message', (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type === 'refresh') mutateRef.current()
      } catch { /* noop */ }
    })
    es.onerror = () => { /* 브라우저 자동 재연결 */ }
    return () => es.close()
  }, [])

  return { data, error, isLoading, refetch: mutate }
}
