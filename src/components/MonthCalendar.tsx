'use client'

import { useMemo, useState } from 'react'
import type { GTMActivity } from '@/lib/types'
import { category, CATEGORY_STYLE, CATEGORY_ORDER, TYPE_STYLE, type Category } from '@/lib/ui'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const BRAND_DOT: Record<string, string> = {
  바이오힐보: 'bg-[#7C3AED]', 웨이크메이크: 'bg-[#DC2626]', 컬러그램: 'bg-[#DB2777]',
  브링그린: 'bg-[#16A34A]', 올리브영: 'bg-[#65A30D]',
}

function parseYMD(d: string): { y: number; m: number; d: number } | null {
  const m = (d || '').match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null
}
const mkey = (y: number, m: number) => y * 12 + (m - 1)
function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n) + '…' : s }

// 데이터가 있는 달 중 (오늘 달 → 이후 가장 가까운 달 → 마지막 달) 순으로 초기 커서 결정
function pickInitial(activities: GTMActivity[]): number {
  const keys = activities.map(a => parseYMD(a.startDate)).filter(Boolean).map(p => mkey(p!.y, p!.m))
  const now = new Date()
  const todayKey = mkey(now.getFullYear(), now.getMonth() + 1)
  if (!keys.length) return todayKey
  const uniq = Array.from(new Set(keys)).sort((a, b) => a - b)
  if (uniq.includes(todayKey)) return todayKey
  return uniq.find(k => k >= todayKey) ?? uniq[uniq.length - 1]
}

export function MonthCalendar({ activities, onSelect }: { activities: GTMActivity[]; onSelect: (a: GTMActivity) => void }) {
  const [cursor, setCursor] = useState<number>(() => pickInitial(activities))
  const [catFilter, setCatFilter] = useState<Set<Category>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())

  const curY = Math.floor(cursor / 12)
  const curM = (cursor % 12) + 1

  // 카테고리 빠른 토글 적용
  const visible = useMemo(
    () => (catFilter.size ? activities.filter(a => catFilter.has(category(a))) : activities),
    [activities, catFilter]
  )

  // 이번 달 시작 활동 (시작일 기준 배치)
  const monthActs = useMemo(
    () => visible.filter(a => { const p = parseYMD(a.startDate); return p && p.y === curY && p.m === curM }),
    [visible, curY, curM]
  )

  // 카테고리별 카운트 (토글 칩 표시용 — 카테고리필터 무시한 전체 기준)
  const catCounts = useMemo(() => {
    const c: Record<string, number> = { 상품: 0, 온라인: 0, 오프라인: 0 }
    activities.forEach(a => { const p = parseYMD(a.startDate); if (p && p.y === curY && p.m === curM) c[category(a)]++ })
    return c
  }, [activities, curY, curM])

  // 달력 셀 구성
  const cells = useMemo(() => {
    const startWeekday = new Date(curY, curM - 1, 1).getDay()
    const daysInMonth = new Date(curY, curM, 0).getDate()
    const out: ({ day: number; acts: GTMActivity[] } | null)[] = []
    for (let i = 0; i < startWeekday; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const acts = monthActs
        .filter(a => parseYMD(a.startDate)!.d === d)
        .sort((a, b) => (a.brand < b.brand ? -1 : a.brand > b.brand ? 1 : 0))
      out.push({ day: d, acts })
    }
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [curY, curM, monthActs])

  const now = new Date()
  const isToday = (d: number) => now.getFullYear() === curY && now.getMonth() + 1 === curM && now.getDate() === d

  const move = (delta: number) => { setCursor(c => c + delta); setExpandedDays(new Set()) }
  const goToday = () => { setCursor(mkey(now.getFullYear(), now.getMonth() + 1)); setExpandedDays(new Set()) }
  const toggleCat = (c: Category) => setCatFilter(prev => {
    const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n
  })
  const toggleDay = (d: number) => setExpandedDays(prev => {
    const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n
  })

  const MAX_PER_DAY = 4

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* 헤더: 월 네비 + 카테고리 토글 */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <span>🗓️</span>
        <h3 className="text-sm font-bold text-gray-800">월 달력</h3>
        <span className="text-2xs text-gray-400">시작일 기준 · 색 = 상품/온라인/오프라인</span>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => move(-1)} className="w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 text-sm" aria-label="이전 달">◀</button>
          <span className="text-sm font-bold text-gray-800 min-w-[88px] text-center tabular-nums">{curY}년 {curM}월</span>
          <button onClick={() => move(1)} className="w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 text-sm" aria-label="다음 달">▶</button>
          <button onClick={goToday} className="ml-1 text-2xs text-gray-500 border border-gray-200 rounded-md px-2 py-1 hover:border-gray-400">오늘</button>
          <span className="ml-1 text-2xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{monthActs.length}건</span>
        </div>

        {/* 카테고리 토글 (클릭해서 보기 한정) */}
        <div className="w-full flex items-center gap-1.5 mt-0.5">
          {CATEGORY_ORDER.map(c => {
            const on = catFilter.has(c)
            const sty = CATEGORY_STYLE[c]
            return (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={`inline-flex items-center gap-1 text-2xs rounded-full px-2 py-0.5 border transition-colors
                  ${on ? `${sty.chip} border-transparent font-semibold` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
              >
                <span className={`w-2 h-2 rounded-sm ${sty.dot}`} />{c}
                <span className="text-gray-400">{catCounts[c]}</span>
              </button>
            )
          })}
          {catFilter.size > 0 && (
            <button onClick={() => setCatFilter(new Set())} className="text-2xs text-gray-400 hover:text-gray-600 ml-0.5">전체</button>
          )}
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/60">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`text-center text-2xs font-semibold py-1.5 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{w}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const weekday = i % 7
          if (!cell) return <div key={i} className="min-h-[92px] border-r border-b border-gray-50 bg-gray-50/30 last:border-r-0" />
          const today = isToday(cell.day)
          const expanded = expandedDays.has(cell.day)
          const shown = expanded ? cell.acts : cell.acts.slice(0, MAX_PER_DAY)
          const overflow = cell.acts.length - shown.length
          return (
            <div key={i} className={`min-h-[92px] border-r border-b border-gray-50 px-1 py-1 align-top ${weekday === 6 ? 'border-r-0' : ''} ${today ? 'bg-red-50/40' : ''}`}>
              <div className="flex items-center justify-between px-0.5">
                <span className={`text-2xs font-semibold ${today ? 'bg-red-500 text-white rounded-full w-4 h-4 inline-flex items-center justify-center' : weekday === 0 ? 'text-red-400' : weekday === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{cell.day}</span>
              </div>
              <div className="mt-0.5 flex flex-col gap-0.5">
                {shown.map(a => {
                  const sty = CATEGORY_STYLE[category(a)]
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelect(a)}
                      title={`[${a.type}] ${a.brand} · ${a.title}${a.product ? ` (${a.product})` : ''} · ${a.startDate}~${a.endDate}`}
                      className={`w-full text-left rounded-sm border-l-2 pl-1 pr-0.5 py-0.5 ${sty.bar} ${sty.bg} hover:brightness-95 transition flex items-center gap-1 ${a.status === '취소' ? 'opacity-40 line-through' : ''}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${BRAND_DOT[a.brand] ?? 'bg-gray-400'}`} />
                      {a.hero && <span className="text-pink-500 text-2xs shrink-0 leading-none">★</span>}
                      <span className={`text-[10px] leading-tight truncate ${sty.text}`}>{trunc(a.product || a.title, 9)}</span>
                      {a.issue && <span className="text-red-400 text-2xs shrink-0 ml-auto">⚠</span>}
                    </button>
                  )
                })}
                {overflow > 0 && (
                  <button onClick={() => toggleDay(cell.day)} className="text-left text-[10px] text-gray-400 hover:text-gray-600 pl-1">+{overflow}건 더보기</button>
                )}
                {expanded && cell.acts.length > MAX_PER_DAY && (
                  <button onClick={() => toggleDay(cell.day)} className="text-left text-[10px] text-gray-400 hover:text-gray-600 pl-1">접기 ▲</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 + 안내 */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-100 bg-gray-50 text-2xs text-gray-400 flex-wrap">
        {CATEGORY_ORDER.map(c => (
          <span key={c} className="inline-flex items-center gap-1"><span className={`w-2 h-2 rounded-sm ${CATEGORY_STYLE[c].dot}`} />{c}</span>
        ))}
        <span className="inline-flex items-center gap-1"><span className="text-pink-500">★</span>주력</span>
        <span className="inline-flex items-center gap-1 text-red-400">⚠ 이슈</span>
        <span className="ml-auto text-gray-300">활동은 <b className="text-gray-400">시작일</b>이 속한 날짜에 표시됩니다 · 점 색 = 브랜드</span>
      </div>
    </div>
  )
}
