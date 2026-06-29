import { NextResponse } from 'next/server'
import { fetchGTMData, getSampleData } from '@/lib/google-sheets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // 공개 시트(링크 보기)를 CSV로 직접 읽음 — 서비스계정/환경변수 불필요.
    // 시트 로드 실패 시에만 샘플로 폴백.
    const data = await fetchGTMData()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[calendar/route] 시트 로드 실패 → 샘플 폴백:', err)
    return NextResponse.json(getSampleData())
  }
}
