import { NextResponse } from 'next/server'
import { fetchGTMData, getSampleData } from '@/lib/google-sheets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const hasSheetConfig =
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_SHEET_ID

    const data = hasSheetConfig ? await fetchGTMData() : getSampleData()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[calendar/route] 오류:', err)
    return NextResponse.json(getSampleData())
  }
}
