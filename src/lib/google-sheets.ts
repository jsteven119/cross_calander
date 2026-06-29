import type { GTMData, GTMActivity, Region, ActivityType, ActivityStatus, RiskLevel } from './types'

// ─── 공개 구글시트(링크 보기 가능)를 서비스계정 없이 CSV로 읽음 ───
// 기본값은 운영 시트. 필요시 환경변수로 덮어쓰기.
const DEFAULT_SHEET_ID = '1Q_JypC7SG9NuvD_gzwFSioWlUAo2jJJVwya-NPkIShI'
const SHEET_ID = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || '통합'

const DEFAULT_REGIONS: Region[] = [
  { name: '국내',   color: '#ec4899', order: 0 },
  { name: '미주',   color: '#3b82f6', order: 1 },
  { name: '중화권', color: '#ef4444', order: 2 },
  { name: '일본',   color: '#8b5cf6', order: 3 },
]

// 헤더 별칭 — 한/영·언더스코어 모두 인식 (통합 탭은 한국어·영문 혼용 가능)
const FIELD_ALIASES: Record<string, string[]> = {
  id: ['id', '번호'],
  region: ['region', '지역', '권역'],
  brand: ['brand', '브랜드'],
  market: ['market', '매체', '마켓'],
  team: ['team', '팀'],
  owner: ['owner', '담당자'],
  type: ['type', '유형'],
  product: ['product', '제품', '상품'],
  hero: ['hero', '히어로', '주력'],
  title: ['title', '행사명', '활동명', '제목'],
  startDate: ['startdate', 'start_date', '시작일', 'start'],
  endDate: ['enddate', 'end_date', '종료일', 'end'],
  status: ['status', '상태'],
  budget: ['budget', '예산'],
  channel: ['channel', '채널'],
  issue: ['issue', '이슈'],
  riskLevel: ['risklevel', 'risk_level', '리스크', 'risk'],
  updatedAt: ['updatedat', 'updated_at', '수정일시'],
  updatedBy: ['updatedby', 'updated_by', '수정자'],
}

function txt(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim()
}
function toBool(v: unknown): boolean {
  const s = txt(v).toLowerCase()
  return s === 'y' || s === 'yes' || s === 'true' || s === '1' || s === 'o'
}
// 날짜 → YYYY-MM-DD ("2026. 8. 1" / 2026/8/1 등 허용)
function normDate(v: unknown): string {
  const s = txt(v)
  if (!s) return ''
  const m = s.match(/(\d{4})[.\-/\s]+(\d{1,2})[.\-/\s]+(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  return s
}

// ── CSV 파서 (따옴표·콤마·개행·"" 이스케이프) ──
function parseCsv(t: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], f = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++ } else q = false }
      else f += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      row.push(f); f = ''
      if (row.some(v => v !== '')) rows.push(row)
      row = []
    } else f += c
  }
  if (f !== '' || row.length) { row.push(f); if (row.some(v => v !== '')) rows.push(row) }
  return rows
}

function headerIndex(header: string[]): Record<string, number> {
  const idx: Record<string, number> = {}
  header.forEach((h, i) => { idx[txt(h).toLowerCase()] = i })
  return idx
}
function colOf(idx: Record<string, number>, field: string): number {
  const aliases = FIELD_ALIASES[field] || [field]
  for (const a of aliases) { const p = idx[a.toLowerCase()]; if (p !== undefined) return p }
  return -1
}

export async function fetchGTMData(): Promise<GTMData> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`시트 응답 오류 ${res.status}`)
  const text = await res.text()
  if (/^\s*(<!DOCTYPE html|<html)/i.test(text.slice(0, 200))) {
    throw new Error('시트가 공개되어 있지 않습니다(링크 보기 허용 필요)')
  }

  const rows = parseCsv(text)
  if (rows.length < 2) throw new Error('시트 데이터가 비어 있습니다')
  const idx = headerIndex(rows[0])
  const g = (r: string[], field: string): string => {
    const p = colOf(idx, field)
    return p >= 0 ? txt(r[p]) : ''
  }

  const activities: GTMActivity[] = rows.slice(1)
    .filter(r => g(r, 'title') || g(r, 'id'))
    .map(r => ({
      id: g(r, 'id') || `${g(r, 'title')}-${g(r, 'startDate')}`,
      region: g(r, 'region'),
      brand: g(r, 'brand'),
      market: g(r, 'market'),
      team: g(r, 'team'),
      owner: g(r, 'owner'),
      type: (g(r, 'type') || '캠페인') as ActivityType,
      product: g(r, 'product'),
      hero: toBool(g(r, 'hero')),
      title: g(r, 'title'),
      startDate: normDate(g(r, 'startDate')),
      endDate: normDate(g(r, 'endDate')) || normDate(g(r, 'startDate')),
      status: (g(r, 'status') || '기획') as ActivityStatus,
      budget: g(r, 'budget'),
      channel: g(r, 'channel'),
      issue: g(r, 'issue'),
      riskLevel: g(r, 'riskLevel') as RiskLevel,
      updatedAt: g(r, 'updatedAt'),
      updatedBy: g(r, 'updatedBy'),
    }))

  // 권역 = 데이터에 등장하는 것만 (없으면 기본)
  const seen = Array.from(new Set(activities.map(a => a.region).filter(Boolean)))
  const regions: Region[] = seen.length
    ? seen.map((name, i) => DEFAULT_REGIONS.find(d => d.name === name)
        ?? { name, color: DEFAULT_REGIONS[i % DEFAULT_REGIONS.length].color, order: i })
    : DEFAULT_REGIONS

  // 데이터 최신 입력시각 = 가장 최근 updatedAt (없으면 fetch 시각)
  const stamps = activities.map(a => a.updatedAt).filter(Boolean).sort()
  const lastUpdated = stamps.length ? stamps[stamps.length - 1] : new Date().toISOString()

  return {
    year: new Date().getFullYear(),
    title: 'GTM 캘린더',
    regions: regions.sort((a, b) => a.order - b.order),
    activities,
    lastUpdated,
  }
}

// ─── 샘플 데이터 (시트 로드 실패 시 폴백) ──────────────────────
export function getSampleData(): GTMData {
  const raw: Array<Partial<GTMActivity>> = [
    { id: 'P-0001', region: '국내', brand: '웨이크메이크', market: '올리브영', team: '국내마케팅', owner: '김지은', type: '신제품출시', product: '헬로키티 컬렉션', hero: true, title: '헬로키티 립/아이 컬렉션 런칭', startDate: '2026-04-10', endDate: '2026-05-30', status: '진행중', budget: '1.5억', channel: '올리브영', issue: '초도 물량 부족 우려', riskLevel: '중', updatedBy: '김지은' },
    { id: 'P-0002', region: '미주', brand: '웨이크메이크', market: '미국-아마존', team: '미주팀', owner: 'Sarah K', type: '신제품출시', product: '헬로키티 컬렉션', hero: true, title: 'Hello Kitty Collection US Launch', startDate: '2026-04-20', endDate: '2026-06-15', status: '확정', budget: '$120K', channel: 'Amazon', issue: '통관 지연 가능성', riskLevel: '상', updatedBy: 'Sarah K' },
    { id: 'P-0003', region: '중화권', brand: '웨이크메이크', market: '중국-티몰', team: '중화권팀', owner: '王伟', type: '프로모션', product: '래스팅 글로우 스틱', hero: true, title: '618 티몰 메가세일', startDate: '2026-06-01', endDate: '2026-06-20', status: '확정', budget: '2억', channel: 'Tmall', issue: 'KOL 섭외 지연', riskLevel: '중', updatedBy: '王伟' },
    { id: 'P-0005', region: '일본', brand: '컬러그램', market: '일본-큐텐', team: '일본팀', owner: '佐藤', type: '캠페인', product: '누드 스탠다드', hero: false, title: 'RE:NUDE 큐텐 메가와리', startDate: '2026-05-01', endDate: '2026-05-31', status: '진행중', budget: '¥8M', channel: 'Qoo10', issue: '', riskLevel: '', updatedBy: '佐藤' },
    { id: 'P-0009', region: '일본', brand: '웨이크메이크', market: '일본-앳코스메', team: '일본팀', owner: '佐藤', type: '프로모션', product: '래스팅 글로우 스틱', hero: true, title: '앳코스메 신상 푸시', startDate: '2026-06-10', endDate: '2026-06-30', status: '기획', budget: '¥5M', channel: '@cosme', issue: '재고 배분 협의 필요', riskLevel: '중', updatedBy: '佐藤' },
  ]
  const now = new Date()
  const activities: GTMActivity[] = raw.map((a, i) => ({
    id: a.id!, region: a.region!, brand: a.brand || '', market: a.market || '', team: a.team || '',
    owner: a.owner || '', type: (a.type || '캠페인') as ActivityType, product: a.product || '',
    hero: a.hero ?? false, title: a.title || '', startDate: a.startDate || '',
    endDate: a.endDate || a.startDate || '', status: (a.status || '기획') as ActivityStatus,
    budget: a.budget || '', channel: a.channel || '', issue: a.issue || '',
    riskLevel: (a.riskLevel || '') as RiskLevel,
    updatedAt: new Date(now.getTime() - i * 37 * 60 * 1000).toISOString(), updatedBy: a.updatedBy || '',
  }))
  return { year: 2026, title: 'GTM 캘린더 (샘플)', regions: DEFAULT_REGIONS, activities, lastUpdated: now.toISOString() }
}
