'use client'

import type { GTMActivity } from '@/lib/types'

// startDate에서 연/월 추출 (YYYY-MM-DD · "YYYY. M. D" 등 허용)
function ym(d: string): { y: number; m: number } | null {
  const mt = (d || '').trim().match(/^(\d{4})\D+(\d{1,2})/)
  return mt ? { y: +mt[1], m: +mt[2] } : null
}
function fmtMD(d: string): string {
  const m = (d || '').match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
  return m ? `${+m[2]}/${+m[3]}` : d
}

// 월별 신상품 출시 목록 (유형=신제품출시·리뉴얼)
export function LaunchCalendar({
  activities,
  onSelect,
}: {
  activities: GTMActivity[]
  onSelect: (a: GTMActivity) => void
}) {
  const launches = activities
    .filter(a => a.type === '신제품출시' || a.type === '리뉴얼')
    .filter(a => ym(a.startDate))
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0))

  const groups: { label: string; items: GTMActivity[] }[] = []
  const idx: Record<string, number> = {}
  for (const a of launches) {
    const k = ym(a.startDate)!
    const key = `${k.y}-${k.m}`
    if (idx[key] === undefined) {
      idx[key] = groups.length
      groups.push({ label: `${k.m}월`, items: [] })
    }
    groups[idx[key]].items.push(a)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <span>🆕</span>
        <h3 className="text-sm font-bold text-gray-800">월별 신상품 출시</h3>
        <span className="ml-auto text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
          {launches.length}건
        </span>
      </div>

      {launches.length === 0 ? (
        <div className="px-3 py-8 text-center text-gray-400 text-xs">
          표시할 신상품 출시가 없습니다 (유형 필터를 확인하세요)
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {groups.map(g => (
            <div key={g.label} className="flex">
              <div className="w-14 shrink-0 bg-pink-50 text-pink-700 font-bold text-sm flex items-start justify-center pt-2.5">
                {g.label}
              </div>
              <div className="flex-1 min-w-0 divide-y divide-gray-50">
                {g.items.map(a => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-2xs text-gray-400 w-10 shrink-0">{fmtMD(a.startDate)}</span>
                    <span className="text-xs text-gray-500 w-20 shrink-0 truncate">{a.brand}</span>
                    <span className="text-xs font-medium text-gray-800 truncate max-w-[260px]">
                      {a.hero && <span className="text-pink-500 mr-0.5">★</span>}
                      {a.product || a.title}
                    </span>
                    {a.product && a.title && a.title !== a.product && (
                      <span className="text-2xs text-gray-400 truncate hidden lg:inline">{a.title}</span>
                    )}
                    <span className="ml-auto text-2xs text-gray-400 shrink-0">{a.market || a.region}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
