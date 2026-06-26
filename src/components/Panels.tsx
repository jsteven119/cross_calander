'use client'

import type { GTMActivity, Conflict, GTMData } from '@/lib/types'
import { STATUS_STYLE, RISK_STYLE, fmtDate, fmtRelTime } from '@/lib/ui'

// ─── KPI 요약 스트립 ──────────────────────────────
export function KpiStrip({ data, conflicts, issues }: { data: GTMData; conflicts: Conflict[]; issues: GTMActivity[] }) {
  const live = data.activities.filter(a => a.status === '진행중').length
  const heroLaunch = data.activities.filter(a => a.hero && a.type === '신제품출시' && a.status !== '취소').length
  const highRisk = issues.filter(i => i.riskLevel === '상').length

  const cards = [
    { label: '진행중 활동', value: live, tone: 'text-green-600' },
    { label: '주력 런칭', value: heroLaunch, tone: 'text-pink-600' },
    { label: '상품 충돌', value: conflicts.length, tone: conflicts.length ? 'text-orange-600' : 'text-gray-400' },
    { label: '고위험 이슈', value: highRisk, tone: highRisk ? 'text-red-600' : 'text-gray-400' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-2xs text-gray-400">{c.label}</p>
          <p className={`text-2xl font-bold ${c.tone}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── 충돌 감지 패널 ──────────────────────────────
export function ConflictPanel({ conflicts, onPick }: { conflicts: Conflict[]; onPick: (product: string) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-orange-500">⚡</span>
        <h3 className="text-sm font-bold text-gray-800">상품 충돌 감지</h3>
        <span className="ml-auto text-2xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">{conflicts.length}</span>
      </div>
      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {conflicts.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-gray-400">겹치는 주력상품 일정 없음 ✓</p>
        )}
        {conflicts.map(c => (
          <button
            key={c.product}
            onClick={() => onPick(c.product)}
            className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800 truncate">{c.product}</span>
              <span className="text-2xs text-orange-600 shrink-0 ml-2">{fmtDate(c.overlapStart)}~{fmtDate(c.overlapEnd)}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {c.regions.map(r => (
                <span key={r} className="text-2xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{r}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 이슈/리스크 보드 ──────────────────────────────
export function IssueBoard({ issues, onSelect }: { issues: GTMActivity[]; onSelect: (a: GTMActivity) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-red-500">⚠</span>
        <h3 className="text-sm font-bold text-gray-800">이슈 · 리스크</h3>
        <span className="ml-auto text-2xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">{issues.length}</span>
      </div>
      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {issues.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-gray-400">등록된 이슈 없음 ✓</p>
        )}
        {issues.map(a => {
          const risk = RISK_STYLE[a.riskLevel] ?? RISK_STYLE['하']
          return (
            <button key={a.id} onClick={() => onSelect(a)} className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className={`text-2xs font-bold rounded px-1.5 py-0.5 shrink-0 ${risk.bg} ${risk.text}`}>{risk.label}</span>
                <span className="text-2xs text-gray-400 shrink-0">{a.region}</span>
                <span className="text-xs font-medium text-gray-700 truncate">{a.product}</span>
              </div>
              <p className="text-2xs text-gray-500 mt-0.5 pl-1 truncate">{a.issue}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 실시간 변경 피드 ──────────────────────────────
export function ChangeFeed({ changes, onSelect }: { changes: GTMActivity[]; onSelect: (a: GTMActivity) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-blue-500">↻</span>
        <h3 className="text-sm font-bold text-gray-800">최근 변경</h3>
      </div>
      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {changes.map(a => (
          <button key={a.id} onClick={() => onSelect(a)} className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-700 truncate">
                <span className="font-medium">{a.team || a.region}</span> · {a.title}
              </span>
              <span className="text-2xs text-gray-400 shrink-0">{fmtRelTime(a.updatedAt)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 활동 상세 드로어 ──────────────────────────────
export function DetailDrawer({ activity, onClose }: { activity: GTMActivity | null; onClose: () => void }) {
  if (!activity) return null
  const st = STATUS_STYLE[activity.status]
  const rows: [string, string][] = [
    ['권역', activity.region],
    ['세부 시장', activity.market],
    ['상품', activity.product + (activity.hero ? ' ★주력' : '')],
    ['유형', activity.type],
    ['기간', `${fmtDate(activity.startDate)} ~ ${fmtDate(activity.endDate)}`],
    ['채널', activity.channel],
    ['예산', activity.budget],
    ['담당', `${activity.team} / ${activity.owner}`],
  ]
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-sm bg-white h-full shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-2">
          <div>
            <span className={`text-2xs rounded-full px-2 py-0.5 ${st.bg} ${st.text}`}>{activity.status}</span>
            <h2 className="text-base font-bold text-gray-800 mt-1.5">{activity.title}</h2>
            <p className="text-2xs text-gray-400 mt-0.5">{activity.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {rows.map(([k, v]) => v && (
            <div key={k} className="flex text-xs">
              <span className="w-20 shrink-0 text-gray-400">{k}</span>
              <span className="text-gray-700">{v}</span>
            </div>
          ))}
          {activity.issue && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-2xs text-red-500 font-medium mb-0.5">
                이슈 {activity.riskLevel && `· 위험도 ${(RISK_STYLE[activity.riskLevel] ?? {label:''}).label}`}
              </p>
              <p className="text-xs text-red-800">{activity.issue}</p>
            </div>
          )}
          {activity.updatedAt && (
            <p className="text-2xs text-gray-400 pt-2">
              최종 수정 {fmtRelTime(activity.updatedAt)} {activity.updatedBy && `· ${activity.updatedBy}`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
