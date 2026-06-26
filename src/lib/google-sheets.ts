import { google } from 'googleapis'
import type { GTMData, GTMActivity, Region, ActivityType, ActivityStatus, RiskLevel } from './types'

// plans 탭의 열 순서 (A=id ... S=updatedBy)
const COLUMNS = [
  'id', 'region', 'brand', 'market', 'team', 'owner', 'type', 'product', 'hero',
  'title', 'startDate', 'endDate', 'status', 'budget', 'channel',
  'issue', 'riskLevel', 'updatedAt', 'updatedBy',
] as const

const DEFAULT_REGIONS: Region[] = [
  { name: '국내',   color: '#ec4899', order: 0 },
  { name: '미주',   color: '#3b82f6', order: 1 },
  { name: '중화권', color: '#ef4444', order: 2 },
  { name: '일본',   color: '#8b5cf6', order: 3 },
]

function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 없습니다')
  const key = JSON.parse(Buffer.from(keyJson, 'base64').toString('utf-8'))
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

function txt(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim()
}

function toBool(v: unknown): boolean {
  const s = txt(v).toLowerCase()
  return s === 'y' || s === 'yes' || s === 'true' || s === '1' || s === 'o'
}

// 날짜를 YYYY-MM-DD로 정규화 (다양한 입력 허용)
function normDate(v: unknown): string {
  const s = txt(v)
  if (!s) return ''
  // 2026-04-10 / 2026.04.10 / 2026/4/10
  const m = s.match(/(\d{4})[.\-/\s]+(\d{1,2})[.\-/\s]+(\d{1,2})/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return s
}

function rowToActivity(row: unknown[]): GTMActivity {
  const r: Record<string, unknown> = {}
  COLUMNS.forEach((c, i) => { r[c] = row[i] })
  return {
    id: txt(r.id),
    region: txt(r.region),
    brand: txt(r.brand),
    market: txt(r.market),
    team: txt(r.team),
    owner: txt(r.owner),
    type: (txt(r.type) || '캠페인') as ActivityType,
    product: txt(r.product),
    hero: toBool(r.hero),
    title: txt(r.title),
    startDate: normDate(r.startDate),
    endDate: normDate(r.endDate) || normDate(r.startDate),
    status: (txt(r.status) || '기획') as ActivityStatus,
    budget: txt(r.budget),
    channel: txt(r.channel),
    issue: txt(r.issue),
    riskLevel: txt(r.riskLevel) as RiskLevel,
    updatedAt: txt(r.updatedAt),
    updatedBy: txt(r.updatedBy),
  }
}

export async function fetchGTMData(): Promise<GTMData> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다')

  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'plans'

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A2:S1000`,   // 1행은 헤더
    valueRenderOption: 'FORMATTED_VALUE',
  })

  const rows = (res.data.values ?? []) as unknown[][]
  const activities = rows
    .filter(r => txt(r[0]) || txt(r[9]))   // id 또는 title 있는 행만
    .map(rowToActivity)

  // 권역 마스터 탭(regions)이 있으면 읽고, 없으면 데이터에서 추출
  let regions = DEFAULT_REGIONS
  try {
    const rr = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'regions!A2:C50',
    })
    const rvals = (rr.data.values ?? []) as unknown[][]
    if (rvals.length) {
      regions = rvals
        .filter(r => txt(r[0]))
        .map((r, i) => ({
          name: txt(r[0]),
          color: txt(r[1]) || DEFAULT_REGIONS[i % DEFAULT_REGIONS.length].color,
          order: Number(txt(r[2])) || i,
        }))
    }
  } catch {
    // regions 탭 없으면 데이터에 등장하는 권역만 사용
    const seen = Array.from(new Set(activities.map(a => a.region).filter(Boolean)))
    if (seen.length) {
      regions = seen.map((name, i) => {
        const known = DEFAULT_REGIONS.find(d => d.name === name)
        return known ?? { name, color: DEFAULT_REGIONS[i % DEFAULT_REGIONS.length].color, order: i }
      })
    }
  }

  return {
    year: new Date().getFullYear(),
    title: 'GTM 캘린더',
    regions: regions.sort((a, b) => a.order - b.order),
    activities,
    lastUpdated: new Date().toISOString(),
  }
}

// ─── 샘플 데이터 (환경변수 없을 때) ──────────────────────
export function getSampleData(): GTMData {
  const raw: Array<Partial<GTMActivity>> = [
    { id: 'P-0001', region: '국내', brand: '웨이크메이크', market: '올리브영', team: '국내마케팅', owner: '김지은', type: '신제품출시', product: '헬로키티 컬렉션', hero: true, title: '헬로키티 립/아이 컬렉션 런칭', startDate: '2026-04-10', endDate: '2026-05-30', status: '진행중', budget: '1.5억', channel: '올리브영', issue: '초도 물량 부족 우려', riskLevel: '중', updatedBy: '김지은' },
    { id: 'P-0002', region: '미주', brand: '웨이크메이크', market: '미국-아마존', team: '미주팀', owner: 'Sarah K', type: '신제품출시', product: '헬로키티 컬렉션', hero: true, title: 'Hello Kitty Collection US Launch', startDate: '2026-04-20', endDate: '2026-06-15', status: '확정', budget: '$120K', channel: 'Amazon', issue: '통관 지연 가능성', riskLevel: '상', updatedBy: 'Sarah K' },
    { id: 'P-0003', region: '중화권', brand: '웨이크메이크', market: '중국-티몰', team: '중화권팀', owner: '王伟', type: '프로모션', product: '래스팅 글로우 스틱', hero: true, title: '618 티몰 메가세일', startDate: '2026-06-01', endDate: '2026-06-20', status: '확정', budget: '2억', channel: 'Tmall', issue: 'KOL 섭외 지연', riskLevel: '중', updatedBy: '王伟' },
    { id: 'P-0004', region: '국내', brand: '웨이크메이크', market: '홈쇼핑', team: '국내마케팅', owner: '박서준', type: '프로모션', product: '래스팅 글로우 스틱', hero: true, title: '홈쇼핑 단독 기획전', startDate: '2026-06-08', endDate: '2026-06-25', status: '기획', budget: '0.8억', channel: '홈쇼핑', issue: '', riskLevel: '', updatedBy: '박서준' },
    { id: 'P-0005', region: '일본', brand: '컬러그램', market: '일본-큐텐', team: '일본팀', owner: '佐藤', type: '캠페인', product: '누드 스탠다드', hero: false, title: 'RE:NUDE 큐텐 메가와리', startDate: '2026-05-01', endDate: '2026-05-31', status: '진행중', budget: '¥8M', channel: 'Qoo10', issue: '', riskLevel: '', updatedBy: '佐藤' },
    { id: 'P-0006', region: '미주', brand: '컬러그램', market: '미국-세포라', team: '미주팀', owner: 'Sarah K', type: '캠페인', product: '볼드 블러 틴트', hero: true, title: 'Bold Blur Tint Sephora 입점', startDate: '2026-07-01', endDate: '2026-08-31', status: '기획', budget: '$200K', channel: 'Sephora', issue: 'FDA 성분 검토 진행중', riskLevel: '상', updatedBy: 'Sarah K' },
    { id: 'P-0007', region: '중화권', brand: '컬러그램', market: '중국-더우인', team: '중화권팀', owner: '李娜', type: '캠페인', product: '볼드 블러 틴트', hero: true, title: '더우인 라이브 커머스', startDate: '2026-07-15', endDate: '2026-08-15', status: '기획', budget: '1.2억', channel: 'Douyin', issue: '', riskLevel: '', updatedBy: '李娜' },
    { id: 'P-0008', region: '국내', brand: '바이오힐보', market: '네이버', team: '국내마케팅', owner: '김지은', type: '프로모션', product: '글로우 쿠션', hero: false, title: '네이버 브랜드데이', startDate: '2026-09-10', endDate: '2026-09-12', status: '기획', budget: '0.4억', channel: '네이버', issue: '', riskLevel: '', updatedBy: '김지은' },
    { id: 'P-0009', region: '일본', brand: '웨이크메이크', market: '일본-앳코스메', team: '일본팀', owner: '佐藤', type: '프로모션', product: '래스팅 글로우 스틱', hero: true, title: '앳코스메 신상 푸시', startDate: '2026-06-10', endDate: '2026-06-30', status: '기획', budget: '¥5M', channel: '@cosme', issue: '재고 배분 협의 필요', riskLevel: '중', updatedBy: '佐藤' },
    { id: 'P-0010', region: '중화권', brand: '바이오힐보', market: '중국-위챗', team: '중화권팀', owner: '陈明', type: '신제품출시', product: '글로우 쿠션', hero: true, title: '글로우 쿠션 위챗 런칭', startDate: '2026-09-01', endDate: '2026-10-15', status: '기획', budget: '1억', channel: 'WeChat', issue: '현지 성분 인증 진행중', riskLevel: '상', updatedBy: '陈明' },
    { id: 'P-0011', region: '국내', brand: '컬러그램', market: '올리브영', team: '국내마케팅', owner: '이수민', type: '캠페인', product: '볼드 블러 틴트', hero: true, title: '볼드 블러 틴트 올리브영 출시', startDate: '2026-07-05', endDate: '2026-08-20', status: '기획', budget: '1억', channel: '올리브영', issue: '', riskLevel: '', updatedBy: '이수민' },
    { id: 'P-0012', region: '일본', brand: '웨이크메이크', market: '일본-라쿠텐', team: '일본팀', owner: '田中', type: '채널행사', product: '헬로키티 컬렉션', hero: true, title: '라쿠텐 슈퍼세일 헬로키티', startDate: '2026-06-04', endDate: '2026-06-11', status: '확정', budget: '¥6M', channel: 'Rakuten', issue: '', riskLevel: '', updatedBy: '田中' },
  ]

  const now = new Date()
  const activities: GTMActivity[] = raw.map((a, i) => ({
    id: a.id!,
    region: a.region!,
    brand: a.brand || '',
    market: a.market || '',
    team: a.team || '',
    owner: a.owner || '',
    type: (a.type || '캠페인') as ActivityType,
    product: a.product || '',
    hero: a.hero ?? false,
    title: a.title || '',
    startDate: a.startDate || '',
    endDate: a.endDate || a.startDate || '',
    status: (a.status || '기획') as ActivityStatus,
    budget: a.budget || '',
    channel: a.channel || '',
    issue: a.issue || '',
    riskLevel: (a.riskLevel || '') as RiskLevel,
    // 변경 피드용: 최근 항목일수록 더 최근 시각
    updatedAt: new Date(now.getTime() - i * 37 * 60 * 1000).toISOString(),
    updatedBy: a.updatedBy || '',
  }))

  return {
    year: 2026,
    title: 'GTM 캘린더',
    regions: DEFAULT_REGIONS,
    activities,
    lastUpdated: now.toISOString(),
  }
}
