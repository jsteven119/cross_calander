import { NextResponse } from 'next/server'
import { fetchCalendarData, getSampleData } from '@/lib/google-sheets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const hasSheetConfig =
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_SHEET_ID

    const data = hasSheetConfig ? await fetchCalendarData() : getSampleData()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[calendar/route] 오류:', err)
    // Google Sheets 연동 실패 시 샘플 데이터로 폴백
    return NextResponse.json(getSampleData())
  }
}
