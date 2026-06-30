// ─── GTM 캘린더 데이터 모델 ───────────────────────────────
// 핵심 원칙: "한 줄 = 한 활동(activity)". 여러 팀/권역이 행 단위로 입력.

// 목적(유형) — 팀 탭 '목적' 컬럼. 구 6종(신제품출시/캠페인/채널행사/리뉴얼/단종)은
// google-sheets.ts 의 TYPE_NORMALIZE 로 이 4종에 매핑된다.
export type ActivityType =
  | '프로모션'
  | '바이럴'
  | '신상품'
  | '상시'

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
  region: string        // 권역 (국내/일본/중국/미국/전사) — 팀 탭에서 자동 태깅
  brand: string         // 브랜드 (웨이크메이크/컬러그램/바이오힐보 …)
  org: string           // 주관 (일본법인/글로벌 마케팅/오프라인 영업팀)
  team: string          // 입력 팀(탭)
  owner: string         // 담당자
  channel: string       // 채널 (온라인 / 오프라인)
  retail: string        // 리테일 (Qoo10/RKT/올리브영/아마존/@cosme/LOFT …)
  media: string         // 온드미디어 (인스타/틱톡/X/유튜브)
  type: ActivityType    // 목적/유형 (프로모션/바이럴/신상품/상시)
  product: string       // 상품/라인명
  hero: boolean         // 주력상품 여부
  title: string         // 행사명
  activity: string      // 활동 (자유서술 — 구체 실행내용)
  count: string         // 건수 (바이럴 실행 수 — 시딩/포스팅/인플루언서 수)
  startDate: string     // YYYY-MM-DD
  endDate: string       // YYYY-MM-DD
  status: ActivityStatus
  budget: string        // 예산 (자유 텍스트, 예: 1.5억)
  market: string        // (deprecated) 구 세부시장 — 하위호환용, 신규 입력 없음
  issue: string         // 이슈/리스크 내용 (입력폼 제외·optional)
  riskLevel: RiskLevel  // 이슈 심각도 (optional)
  updatedAt: string     // 자동 갱신 (ISO/yyyy-MM-dd HH:mm)
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
