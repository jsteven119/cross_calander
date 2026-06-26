// ─── GTM 캘린더 데이터 모델 ───────────────────────────────
// 핵심 원칙: "한 줄 = 한 활동(activity)". 여러 팀/권역이 행 단위로 입력.

export type ActivityType =
  | '신제품출시'
  | '프로모션'
  | '캠페인'
  | '채널행사'
  | '리뉴얼'
  | '단종'

export type ActivityStatus =
  | '기획'
  | '확정'
  | '진행중'
  | '완료'
  | '보류'
  | '취소'

export type RiskLevel = '상' | '중' | '하' | ''

// 브랜드 (자사 멀티브랜드)
export const BRANDS = ['웨이크메이크', '컬러그램', '바이오힐보'] as const

export interface GTMActivity {
  id: string
  region: string        // 권역 (국내/미주/중화권/일본)
  brand: string         // 브랜드 (웨이크메이크/컬러그램/바이오힐보)
  market: string        // 세부 국가·채널 (미국-아마존 등)
  team: string          // 입력 팀
  owner: string         // 담당자
  type: ActivityType
  product: string       // 상품/라인명
  hero: boolean         // 주력상품 여부
  title: string         // 활동명
  startDate: string     // YYYY-MM-DD
  endDate: string       // YYYY-MM-DD
  status: ActivityStatus
  budget: string        // 예산 (자유 텍스트, 예: 1.5억)
  channel: string       // 채널
  issue: string         // 이슈/리스크 내용
  riskLevel: RiskLevel  // 이슈 심각도
  updatedAt: string     // 자동 갱신 (ISO)
  updatedBy: string     // 자동 기입
}

export interface Region {
  name: string
  color: string         // hex
  order: number
}

// 충돌 감지 결과: 같은 주력상품이 서로 다른 권역에서 기간 겹침
export interface Conflict {
  product: string
  activities: GTMActivity[]   // 겹치는 활동들
  regions: string[]
  overlapStart: string
  overlapEnd: string
}

export interface GTMData {
  year: number
  title: string
  regions: Region[]
  activities: GTMActivity[]
  lastUpdated: string
}

export interface RefreshEvent {
  type: 'refresh'
  timestamp: string
}
