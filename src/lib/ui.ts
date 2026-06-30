import type { ActivityStatus, ActivityType, GTMActivity } from './types'

// ─── 활동 카테고리 (상품 / 온라인 / 오프라인) — 모든 뷰 공통 단일 소스 ───
export type Category = '상품' | '온라인' | '오프라인'

export function category(a: GTMActivity): Category {
  if (a.type === '신제품출시' || a.type === '리뉴얼') return '상품'
  const s = `${a.channel} ${a.market} ${a.title}`
  if (/오프라인|돈키|로프트|loft|매장|팝업|타나와리|돈코스|코스페스|k코스/i.test(s)) return '오프라인'
  return '온라인'
}

export const CATEGORY_STYLE: Record<Category, { dot: string; bar: string; bg: string; text: string; chip: string }> = {
  '상품':   { dot: 'bg-violet-500', bar: 'border-l-violet-400', bg: 'bg-violet-50', text: 'text-violet-700', chip: 'bg-violet-100 text-violet-700' },
  '온라인': { dot: 'bg-sky-500',    bar: 'border-l-sky-400',    bg: 'bg-sky-50',    text: 'text-sky-700',    chip: 'bg-sky-100 text-sky-700' },
  '오프라인': { dot: 'bg-amber-500', bar: 'border-l-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700',  chip: 'bg-amber-100 text-amber-700' },
}

export const CATEGORY_ORDER: Category[] = ['상품', '온라인', '오프라인']

export const STATUS_STYLE: Record<ActivityStatus, { bg: string; text: string; dot: string }> = {
  '기획':   { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  '확정':   { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  '진행중': { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  '완료':   { bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400' },
  '보류':   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  '취소':   { bg: 'bg-red-50',     text: 'text-red-400',    dot: 'bg-red-300' },
}

export const TYPE_STYLE: Record<ActivityType, string> = {
  '신제품출시': 'bg-pink-500',
  '프로모션':   'bg-amber-500',
  '캠페인':     'bg-purple-500',
  '채널행사':   'bg-teal-500',
  '리뉴얼':     'bg-blue-500',
  '단종':       'bg-gray-500',
}

export const RISK_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  '상': { bg: 'bg-red-500',    text: 'text-white', label: '높음' },
  '중': { bg: 'bg-amber-400',  text: 'text-white', label: '중간' },
  '하': { bg: 'bg-yellow-200', text: 'text-yellow-800', label: '낮음' },
}

// 날짜 → 해당 연도 내 위치 비율 (0~1)
export function dateToYearFraction(dateStr: string, year: number): number {
  if (!dateStr) return 0
  const d = new Date(dateStr + 'T00:00:00')
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  const t = d.getTime()
  return Math.max(0, Math.min(1, (t - start) / (end - start)))
}

export function fmtDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function fmtRelTime(iso: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

export const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
