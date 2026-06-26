import { google } from 'googleapis'
import type { CalendarData, MonthData, SalesData, PromotionItem, ProductItem, CampaignItem } from './types'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 없습니다')
  const key = JSON.parse(Buffer.from(keyJson, 'base64').toString('utf-8'))
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(String(val).replace(/,/g, '').trim())
  return isNaN(n) ? null : n
}

function parseText(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

// 시트의 행 데이터에서 월별 값 배열 추출 (열 인덱스 1~12 = 1월~12월)
function extractMonthlyValues(row: unknown[]): unknown[] {
  return Array.from({ length: 12 }, (_, i) => row[i + 1] ?? '')
}

// 상품명 파싱: "립스틱(셀일) (3)" → {name, count}
function parseProduct(raw: string): { name: string; count: number | undefined } {
  const m = raw.match(/^(.+?)\s*\((\d+)\)\s*$/)
  if (m) return { name: m[1].trim(), count: parseInt(m[2]) }
  return { name: raw.trim(), count: undefined }
}

// 한 셀에 여러 상품이 있는 경우 파싱 (줄바꿈 또는 • 구분)
function parseProductCell(cell: string): ProductItem[] {
  if (!cell) return []
  return cell
    .split(/\n|•|-/)
    .map(s => s.trim())
    .filter(Boolean)
    .map((s, i) => {
      const { name, count } = parseProduct(s)
      return { name, count, type: i === 0 ? 'main' : 'sub' } as ProductItem
    })
}

function parseCampaign(cell: string): CampaignItem | null {
  if (!cell) return null
  const lines = cell.split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) return null
  const budgetLine = lines.find(l => l.includes('억') || l.includes('만원'))
  return {
    title: lines[0],
    description: lines.slice(1).join(' '),
    budget: budgetLine,
  }
}

// 시트에서 특정 카테고리 행 찾기
function findRow(rows: unknown[][], keyword: string): unknown[] | undefined {
  return rows.find(r => parseText(r[0]).includes(keyword))
}

// 카테고리 이름이 있는 행부터 다음 카테고리까지의 행들을 수집
function findRowRange(rows: unknown[][], startKeyword: string, endKeyword?: string): unknown[][] {
  const startIdx = rows.findIndex(r => parseText(r[0]).includes(startKeyword))
  if (startIdx === -1) return []
  const endIdx = endKeyword
    ? rows.findIndex((r, i) => i > startIdx && parseText(r[0]).includes(endKeyword))
    : startIdx + 1
  return rows.slice(startIdx, endIdx === -1 ? startIdx + 10 : endIdx)
}

export async function fetchCalendarData(): Promise<CalendarData> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다')

  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1'

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:N100`,
    valueRenderOption: 'FORMATTED_VALUE',
  })

  const rows = (response.data.values ?? []) as unknown[][]

  // 타이틀 행 찾기 (첫 행에 "플래너" 포함)
  const titleRow = rows.find(r => parseText(r[0]).includes('플래너'))
  const title = titleRow ? parseText(titleRow[0]) : '연간 플래너'

  // 매출 행
  const brandRow = findRow(rows, '브랜드 전체') || findRow(rows, '전체 매출')
  const domesticRow = findRow(rows, '국내')

  // 프로모션 행
  const promotionRows = findRowRange(rows, '프로모션', '상품 플랜')

  // 상품 플랜터 행
  const productRows = findRowRange(rows, '상품', '마케팅')

  // 마케팅 행
  const mainCampaignRow = findRow(rows, '주력 캠페인')
  const continuousRow = findRow(rows, '상시 캠페인')
  const ugcRow = findRow(rows, 'UGC')

  const months: MonthData[] = Array.from({ length: 12 }, (_, i) => {
    const monthIdx = i + 1

    // 매출
    const sales: SalesData = {
      brandTotal: brandRow ? parseNumber(brandRow[monthIdx]) : null,
      domestic: domesticRow ? parseNumber(domesticRow[monthIdx]) : null,
    }

    // 프로모션
    const promotions: PromotionItem[] = promotionRows
      .map(r => {
        const channel = parseText(r[0])
        const name = parseText(r[monthIdx])
        return name ? { channel, name } : null
      })
      .filter(Boolean) as PromotionItem[]

    // 상품
    const productCells = productRows.map(r => parseText(r[monthIdx])).filter(Boolean)
    const products: ProductItem[] = productCells.flatMap(cell => parseProductCell(cell))

    // 캠페인
    const mainCampaign = mainCampaignRow
      ? parseCampaign(parseText(mainCampaignRow[monthIdx]))
      : null
    const continuousCampaign = continuousRow
      ? parseCampaign(parseText(continuousRow[monthIdx]))
      : null
    const ugcContent = ugcRow ? parseText(ugcRow[monthIdx]) : ''

    return {
      month: monthIdx,
      sales,
      promotions,
      products,
      mainCampaign,
      continuousCampaign,
      ugcContent,
    }
  })

  return {
    year: new Date().getFullYear(),
    title,
    months,
    lastUpdated: new Date().toISOString(),
  }
}

// 환경변수 없을 때 보여줄 샘플 데이터 (스프레드시트 이미지 기반)
export function getSampleData(): CalendarData {
  const promotionsByMonth: Record<number, PromotionItem[]> = {
    2: [{ channel: '홈쇼핑', name: 'My Color My Way 립스틱 캠페인' }],
    3: [{ channel: '외부채널', name: '(YBM원작) 외부채널 뷰티슈퍼위크' }],
    4: [{ channel: '홈쇼핑', name: '홈쇼핑 세일' }],
    5: [{ channel: '네이버', name: '네이버 신상워크' }],
    6: [{ channel: '홈쇼핑', name: '홈쇼핑세일' }],
    7: [{ channel: '홈쇼핑', name: '홈쇼핑' }],
    9: [{ channel: '홈쇼핑', name: '홈쇼핑세일, 홈쇼핑(180)' }],
    10: [{ channel: '네이버', name: '네이버 뷰쇼위' }],
    11: [{ channel: '홈쇼핑', name: '홀리데이, 브랜드데이, 네이버 날다세일' }],
    12: [{ channel: '홈쇼핑', name: '아이워즈, 홈쇼핑세일' }],
  }

  const productsByMonth: Record<number, ProductItem[]> = {
    2: [{ name: '헬글밤/소볼밤 (11)', type: 'main' }],
    3: [
      { name: '립스틱기획 (세일)', type: 'main' },
      { name: '소볼기기획 (세일)', type: 'sub' },
      { name: '믹스볼러리스액 (출시)', type: 'sub' },
    ],
    4: [
      { name: '헬로키티 립/아이/베이스/카트 (30)', count: 30, type: 'main' },
      { name: '볼드 블러 탄트 (20)', count: 20, type: 'sub' },
    ],
    5: [
      { name: '누드 스탠다드 컬렉션 립/아이/베이스/카트 (30)', count: 30, type: 'main' },
      { name: '글로우 스킨 (6)', count: 6, type: 'sub' },
    ],
    6: [
      { name: '래스팅 글로우 스틱 (10)', count: 10, type: 'main' },
      { name: '스킨 퍼펙팅 쿠션', type: 'sub' },
    ],
    7: [
      { name: '래이오프드 키티 립/아이/베이스/스 (19)', count: 19, type: 'main' },
    ],
    8: [
      { name: '오프체리컬렉션 립/아이/베이스/스 (19)', count: 19, type: 'main' },
    ],
    9: [
      { name: '윈터 글로우 틴트 팔러추가 (4)', count: 4, type: 'main' },
    ],
    12: [
      { name: '어워즈 및 세일 기획 립/아이/치크 (8)', count: 8, type: 'main' },
    ],
  }

  const mainCampaignsByMonth: Record<number, CampaignItem> = {
    2: {
      title: '모델 가용 립스틱 중심 여성상 각진 캠페인 연계 《My Color, My Way》',
      description: '국목: 립스틱 브랜드 아이덴티티 구축, 국내 20대 여성 강화 UGC 활용',
      budget: '약 1.35억',
    },
    3: {
      title: '파라곤손 협업 \'볼드 블러 탄트\' 출시',
      description: '컬러/아이크리밀 중심 IP 출시 약 2개월간 다향한 콘텐츠 운영',
      budget: '약 1.35억',
    },
    5: {
      title: '누드 스탠다드 컬렉션 \'RE:NUDE\' 캠페인',
      description: '누드 블러의 새로운 스탠다드, 신제품 출시 바이럴 진행',
      budget: '약 1.5억',
    },
    6: {
      title: '래스팅 글로우 스틱 신제품 래슈얼 MKT',
      description: '팔러/아이크리밀 중심 IP 팔러 캠페인 운영 상시 바이럴 전개',
      budget: '약 0.8억',
    },
  }

  const salesData: Record<number, { brand: number; domestic: number }> = {
    1:  { brand: 7159, domestic: 5560 },
    2:  { brand: 6375, domestic: 4677 },
    3:  { brand: 10899, domestic: 6896 },
    4:  { brand: 11168, domestic: 6394 },
    5:  { brand: 9700, domestic: 7353 },
    6:  { brand: 12294, domestic: 8966 },
    7:  { brand: 11762, domestic: 8366 },
    8:  { brand: 10450, domestic: 7755 },
    9:  { brand: 14317, domestic: 9370 },
    10: { brand: 9264, domestic: 6192 },
    11: { brand: 11576, domestic: 7416 },
    12: { brand: 9964, domestic: 7936 },
  }

  const months: MonthData[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const s = salesData[m] ?? { brand: 0, domestic: 0 }
    return {
      month: m,
      sales: { brandTotal: s.brand, domestic: s.domestic },
      promotions: promotionsByMonth[m] ?? [],
      products: productsByMonth[m] ?? [],
      mainCampaign: mainCampaignsByMonth[m] ?? null,
      continuousCampaign: m >= 5 && m <= 12 ? {
        title: '립스틱cat 강화 상시 MKT',
        description: '헬글밤/소볼밤 중심 30Y 기포 확대를 위한 상시 바이럴 전개',
        budget: '약 0.4억',
      } : null,
      ugcContent: m >= 3 ? `스프레이AI 바이랄 MKT\n(0.16억, 월 30건)` : '',
    }
  })

  return {
    year: 2026,
    title: '■ 웨이크메이크 \'26 전체 플래너',
    months,
    lastUpdated: new Date().toISOString(),
  }
}
