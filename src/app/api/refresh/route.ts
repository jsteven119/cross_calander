import { NextRequest, NextResponse } from 'next/server'
import { broadcastRefresh } from '@/lib/cache'

export const dynamic = 'force-dynamic'

// Apps Script에서 호출: POST /api/refresh?secret=xxx
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.REFRESH_SECRET) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  broadcastRefresh()
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
}

// 개발 편의: GET으로도 호출 가능
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.REFRESH_SECRET) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }
  broadcastRefresh()
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
}
