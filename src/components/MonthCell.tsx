'use client'

import type { MonthData } from '@/lib/types'

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

interface Props {
  data: MonthData
  isCurrentMonth: boolean
}

export function MonthHeader({ month, isCurrentMonth }: { month: number; isCurrentMonth: boolean }) {
  return (
    <div className={`
      sticky top-0 z-10 text-center py-2 text-sm font-bold border-b border-gray-200
      ${isCurrentMonth
        ? 'bg-brand-500 text-white'
        : 'bg-gray-50 text-gray-700'}
    `}>
      {MONTH_LABELS[month - 1]}
    </div>
  )
}

export function SalesCell({ data }: Props) {
  const fmt = (n: number | null) =>
    n !== null ? n.toLocaleString() : '—'
  return (
    <div className="px-2 py-2 space-y-1">
      <div className="text-center">
        <span className="text-xs text-gray-500">전체</span>
        <p className="text-sm font-semibold text-blue-700">
          {fmt(data.sales.brandTotal)}
        </p>
      </div>
      <div className="text-center border-t border-gray-100 pt-1">
        <span className="text-xs text-gray-500">국내</span>
        <p className="text-xs font-medium text-blue-500">
          {fmt(data.sales.domestic)}
        </p>
      </div>
    </div>
  )
}

export function PromotionCell({ data }: Props) {
  if (!data.promotions.length) {
    return <div className="px-2 py-2 text-xs text-gray-300 text-center">—</div>
  }
  return (
    <div className="px-2 py-2 space-y-1">
      {data.promotions.map((p, i) => (
        <div key={i} className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5">
          <span className="text-2xs text-amber-600 font-medium block">{p.channel}</span>
          <span className="text-xs text-amber-900 leading-tight block">{p.name}</span>
        </div>
      ))}
    </div>
  )
}

export function ProductCell({ data }: Props) {
  if (!data.products.length) {
    return <div className="px-2 py-2 text-xs text-gray-300 text-center">—</div>
  }
  return (
    <div className="px-2 py-2 space-y-1">
      {data.products.map((p, i) => (
        <div
          key={i}
          className={`rounded px-1.5 py-0.5 text-xs leading-tight
            ${p.type === 'main'
              ? 'bg-pink-50 border border-pink-200 text-pink-900 font-medium'
              : 'bg-gray-50 border border-gray-200 text-gray-600'
            }`}
        >
          {p.name}
          {p.count !== undefined && (
            <span className="ml-1 text-2xs opacity-70">({p.count})</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function CampaignCell({ data, type }: Props & { type: 'main' | 'continuous' }) {
  const campaign = type === 'main' ? data.mainCampaign : data.continuousCampaign
  if (!campaign) {
    return <div className="px-2 py-2 text-xs text-gray-300 text-center">—</div>
  }
  return (
    <div className="px-2 py-2">
      <div className={`rounded p-1.5 text-xs leading-tight
        ${type === 'main'
          ? 'bg-purple-50 border border-purple-200'
          : 'bg-green-50 border border-green-200'}`}
      >
        <p className={`font-semibold mb-0.5 ${type === 'main' ? 'text-purple-900' : 'text-green-900'}`}>
          {campaign.title}
        </p>
        {campaign.description && (
          <p className="text-gray-500 text-2xs line-clamp-2">{campaign.description}</p>
        )}
        {campaign.budget && (
          <p className={`text-2xs mt-0.5 font-medium ${type === 'main' ? 'text-purple-600' : 'text-green-600'}`}>
            {campaign.budget}
          </p>
        )}
      </div>
    </div>
  )
}

export function UGCCell({ data }: Props) {
  if (!data.ugcContent) {
    return <div className="px-2 py-2 text-xs text-gray-300 text-center">—</div>
  }
  return (
    <div className="px-2 py-2">
      <div className="rounded bg-teal-50 border border-teal-200 px-1.5 py-1">
        <p className="text-xs text-teal-800 leading-tight whitespace-pre-line">
          {data.ugcContent}
        </p>
      </div>
    </div>
  )
}
