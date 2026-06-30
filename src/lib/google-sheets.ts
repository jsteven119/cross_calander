import type { GTMData, GTMActivity, Region, ActivityType, ActivityStatus, RiskLevel } from './types'

// ─── 공개 구글시트(링크 보기)를 서비스계정 없이 CSV로 직접 읽음 ───
// 대시보드는 '통합' 탭이 아니라 팀 탭 9개를 직접 병렬로 읽어 합친다.
// → [② 통합 갱신]을 누르지 않아도 항상 최신 / 통합 탭 손상 위험 제거.
const DEFAULT_SHEET_ID = '1Q_JypC7SG9NuvD_gzwFSioWlUAo2jJJVwya-NPkIShI'
const SHEET_ID = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID

// 팀 탭(국가×기능) — Apps Script TEAMS 미러. region/func 는 탭 식별로 자동 태깅.
const TEAM_TABS: { name: string; region: string; func: string }[] = [
  { name: 'BM',       region: '전사', func: '상품기획' },
  { name: '국내영업',   region: '국내', func: '영업' },
  { name: '국내마케팅', region: '국내', func: '마케팅' },
  { name: '일본영업',   region: '일본', func: '영업' },
  { name: '일본마케팅', region: '일본', func: '마케팅' },
  { name: '중국영업',   region: '중국', func: '영업' },
  { name: '중국마케팅', region: '중국', func: '마케팅' },
  { name: '미국영업',   region: '미국', func: '영업' },
  { name: '미국마케팅', region: '미국', func: '마케팅' },
]

const DEFAULT_REGIONS: Region[] = [
  { name: '국내', color: '#ec4899', order: 0 },
  { name: '일본', color: '#8b5cf6', order: 1 },
  { name: '중국', color: '#ef4444', order: 2 },
  { name: '미국', color: '#3b82f6', order: 3 },
  { name: '전사', color: '#64748b', order: 4 },
]

// 헤더 별칭 — 한/영·신구 스키마 모두 인식 (마이그레이션 전후 모두 동작)
// 주의: 신규 온드미디어 컬럼 라벨은 '미디어' (레거시 '매체'=리테일과 충돌 방지)
const FIELD_ALIASES: Record<string, string[]> = {
  id: ['id', '번호'],
  region: ['region', '지역', '권역'],
  brand: ['brand', '브랜드'],
  org: ['org', '주관'],
  team: ['team', '팀'],
  owner: ['owner', '담당자'],
  channel: ['channel', '채널'],
  retail: ['retail', '매체', 'market', '마켓', '소매처'], // 'Retail' 헤더는 소문자화되어 'retail'로 매칭
  media: ['media', '미디어'],
  type: ['type', '목적', '유형'],
  product: ['product', '제품', '상품'],
  hero: ['hero', '히어로', '주력'],
  title: ['title', '행사명', '제목'],
  activity: ['activity', '활동'],
  startDate: ['startdate', 'start_date', '시작일', '출시일', 'start'],
  endDate: ['enddate', 'end_date', '종료일', 'end'],
  status: ['status', '상태'],
  budget: ['budget', '예산'],
  issue: ['issue', '이슈'],
  riskLevel: ['risklevel', 'risk_level', '리스크', 'risk'],
  updatedAt: ['updatedat', 'updated_at', '수정일시'],
  updatedBy: ['updatedby', 'updated_by', '수정자'],
}

// 구 유형(6종) → 신 목적(4종) 정규화. 미마이그레이션 행도 정상 표시되게 함.
const TYPE_NORMALIZE: Record<string, ActivityType> = {
  '신제품출시': '신상품', '리뉴얼': '신상품', '신상품': '신상품', '출시': '신상품',
  '캠페인': '프로모션', '채널행사': '프로모션', '프로모션': '프로모션',
  '바이럴': '바이럴', '시딩': '바이럴',
  '단종': '상시', '상시': '상시',
}
function normType(v: unknown): ActivityType {
  const s = txt(v)
  return TYPE_NORMALIZE[s] || '프로모션'
}

function txt(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim()
}

// 활동이 아닌 집계/소계/비용 라벨 행 제외 (예: "바이럴 비용 소계", "합계", "인원수")
// 주의: '인원'만 쓰면 '올인원'(all-in-one) 같은 제품명에 오탐 → '인원수'로 한정
const METRIC_RE = /소계|합계|총계|총합|누계|\bttl\b|\btotal\b|인원\s*수|비용\s*소계/i
function isMetricRow(title: string, product: string): boolean {
  if (METRIC_RE.test(title) || METRIC_RE.test(product)) return true
  // 짧은 '○○ 비용' 형태(바이럴 비용, 광고비용 등) = 예산 라벨 → 제외
  if (/^.{0,8}비용$/.test(title) || /^.{0,8}비용$/.test(product)) return true
  return false
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

// 팀 탭 하나의 CSV 행렬을 가져옴. 비공개/없음/빈 탭은 null.
async function fetchTabRows(tab: string): Promise<string[][] | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const text = await res.text()
    if (/^\s*(<!DOCTYPE html|<html)/i.test(text.slice(0, 200))) return null
    const rows = parseCsv(text)
    return rows.length >= 2 ? rows : null
  } catch {
    return null
  }
}

export async function fetchGTMData(): Promise<GTMData> {
  const fetched = await Promise.all(
    TEAM_TABS.map(t => fetchTabRows(t.name).then(rows => ({ t, rows })))
  )

  const activities: GTMActivity[] = []
  for (const { t, rows } of fetched) {
    if (!rows || rows.length < 2) continue
    const idx = headerIndex(rows[0])
    const g = (r: string[], field: string): string => {
      const p = colOf(idx, field)
      return p >= 0 ? txt(r[p]) : ''
    }
    rows.slice(1)
      .filter(r => g(r, 'title') || g(r, 'product') || g(r, 'id'))
      .filter(r => !isMetricRow(g(r, 'title'), g(r, 'product')))
      .forEach(r => {
        const retail = g(r, 'retail')
        activities.push({
          id: g(r, 'id') || `${t.name}-${g(r, 'title')}-${g(r, 'startDate')}`,
          region: t.region,                 // 탭 식별로 자동 태깅
          brand: g(r, 'brand'),
          org: g(r, 'org'),
          team: t.name,
          owner: g(r, 'owner'),
          channel: g(r, 'channel'),
          retail,
          media: g(r, 'media'),
          type: normType(g(r, 'type')),
          product: g(r, 'product'),
          hero: toBool(g(r, 'hero')),
          title: g(r, 'title') || g(r, 'product'),
          activity: g(r, 'activity'),
          startDate: normDate(g(r, 'startDate')),
          endDate: normDate(g(r, 'endDate')) || normDate(g(r, 'startDate')),
          status: (g(r, 'status') || '기획') as ActivityStatus,
          budget: g(r, 'budget'),
          market: retail,                    // 하위호환: market = retail
          issue: g(r, 'issue'),
          riskLevel: g(r, 'riskLevel') as RiskLevel,
          updatedAt: g(r, 'updatedAt'),
          updatedBy: g(r, 'updatedBy'),
        })
      })
  }

  if (!activities.length) throw new Error('팀 탭에서 활동을 읽지 못했습니다(시트 공개·탭 이름 확인)')

  // 권역 = 실제 활동이 있는 것만 (DEFAULT 순서)
  const present = new Set(activities.map(a => a.region).filter(Boolean))
  const regions = DEFAULT_REGIONS.filter(r => present.has(r.name))

  const stamps = activities.map(a => a.updatedAt).filter(Boolean).sort()
  const lastUpdated = stamps.length ? stamps[stamps.length - 1] : new Date().toISOString()

  return {
    year: new Date().getFullYear(),
    title: 'GTM 캘린더',
    regions: regions.length ? regions : DEFAULT_REGIONS,
    activities,
    lastUpdated,
  }
}

// ─── 샘플 데이터 (시트 로드 실패 시 폴백) ──────────────────────
export function getSampleData(): GTMData {
  const raw: Array<Partial<GTMActivity>> = [
    { id: 'S-0001', region: '국내', brand: '웨이크메이크', org: '글로벌 마케팅', team: '국내마케팅', owner: '김지은', channel: '오프라인', retail: '올리브영', media: '인스타그램', type: '신상품', product: '헬로키티 컬렉션', hero: true, title: '헬로키티 립/아이 컬렉션 런칭', activity: '올영 매대 + 인스타 릴스', startDate: '2026-07-10', endDate: '2026-08-30', status: '진행중', budget: '1.5억', updatedBy: '김지은' },
    { id: 'S-0002', region: '미국', brand: '웨이크메이크', org: '글로벌 마케팅', team: '미국마케팅', owner: 'Sarah K', channel: '온라인', retail: '아마존', media: '틱톡', type: '프로모션', product: '헬로키티 컬렉션', hero: true, title: 'Hello Kitty US Amazon Deal', activity: 'Amazon Prime Day 딜', startDate: '2026-07-20', endDate: '2026-08-15', status: '확정', budget: '$120K', updatedBy: 'Sarah K' },
    { id: 'S-0003', region: '중국', brand: '웨이크메이크', org: '글로벌 마케팅', team: '중국마케팅', owner: '王伟', channel: '온라인', retail: '기타', media: '기타', type: '프로모션', product: '래스팅 글로우 스틱', hero: true, title: '티몰 메가세일', activity: 'KOL 라이브 3회', startDate: '2026-08-01', endDate: '2026-08-20', status: '확정', budget: '2억', updatedBy: '王伟' },
    { id: 'S-0005', region: '일본', brand: '컬러그램', org: '일본법인', team: '일본마케팅', owner: '佐藤', channel: '온라인', retail: 'Qoo10', media: 'X', type: '프로모션', product: '누드 스탠다드', hero: false, title: 'RE:NUDE 큐텐 메가와리', activity: '메가와리 D2 라이브', startDate: '2026-09-01', endDate: '2026-09-15', status: '기획', budget: '¥8M', updatedBy: '佐藤' },
    { id: 'S-0009', region: '일본', brand: '바이오힐보', org: '일본법인', team: '일본마케팅', owner: '佐藤', channel: '오프라인', retail: '@cosme', media: '인스타그램', type: '바이럴', product: 'NAD 크림', hero: true, title: '@cosme 신상 푸시', activity: '앳코스메 매장 시딩', startDate: '2026-09-10', endDate: '2026-09-30', status: '기획', budget: '¥5M', updatedBy: '佐藤' },
  ]
  const now = new Date()
  const activities: GTMActivity[] = raw.map((a, i) => ({
    id: a.id!, region: a.region || '', brand: a.brand || '', org: a.org || '', team: a.team || '',
    owner: a.owner || '', channel: a.channel || '', retail: a.retail || '', media: a.media || '',
    type: (a.type || '프로모션') as ActivityType, product: a.product || '',
    hero: a.hero ?? false, title: a.title || '', activity: a.activity || '',
    startDate: a.startDate || '', endDate: a.endDate || a.startDate || '',
    status: (a.status || '기획') as ActivityStatus, budget: a.budget || '',
    market: a.retail || '', issue: a.issue || '', riskLevel: (a.riskLevel || '') as RiskLevel,
    updatedAt: new Date(now.getTime() - i * 37 * 60 * 1000).toISOString(), updatedBy: a.updatedBy || '',
  }))
  return { year: 2026, title: 'GTM 캘린더 (샘플)', regions: DEFAULT_REGIONS, activities, lastUpdated: now.toISOString() }
}
