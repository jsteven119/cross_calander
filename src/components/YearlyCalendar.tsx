'use client'

import type { CalendarData } from '@/lib/types'
import {
  MonthHeader,
  SalesCell,
  PromotionCell,
  ProductCell,
  CampaignCell,
  UGCCell,
} from './MonthCell'

interface Props {
  data: CalendarData
  lastRefreshed: Date
}

const ROW_SECTIONS = [
  { key: 'sales',       label: '매출 목표',     sublabel: '(백만)',     color: 'bg-blue-50'   },
  { key: 'promotion',   label: '주요 프로모션',  sublabel: '',           color: 'bg-amber-50'  },
  { key: 'product',     label: '연간 상품 플랜', sublabel: '주요 상품',  color: 'bg-pink-50'   },
  { key: 'mainCampaign',label: '주력 캠페인',   sublabel: '국내마케팅', color: 'bg-purple-50' },
  { key: 'continuous',  label: '상시 캠페인',   sublabel: '',           color: 'bg-green-50'  },
  { key: 'ugc',         label: 'UGC 콘텐츠',   sublabel: '',           color: 'bg-teal-50'   },
]

export function YearlyCalendar({ data, lastRefreshed }: Props) {
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="w-full">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 sticky top-0 z-20">
        <h1 className="text-base font-bold text-gray-800 truncate">{data.title}</h1>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400">
            업데이트: {lastRefreshed.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <LiveIndicator />
        </div>
      </div>

      {/* 캘린더 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '1400px' }}>
          <colgroup>
            <col style={{ width: '120px' }} />
            {data.months.map(m => (
              <col key={m.month} style={{ width: `${(100 - 8.5) / 12}%` }} />
            ))}
          </colgroup>

          {/* 월 헤더 */}
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-100 border border-gray-200 px-2 py-2 text-xs text-gray-500 font-medium">
                카테고리
              </th>
              {data.months.map(m => (
                <th key={m.month} className="border border-gray-200 p-0">
                  <MonthHeader month={m.month} isCurrentMonth={m.month === currentMonth} />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ROW_SECTIONS.map(section => (
              <tr key={section.key} className="group">
                {/* 카테고리 레이블 */}
                <td className={`sticky left-0 z-10 border border-gray-200 px-2 py-2 ${section.color} align-top`}>
                  <p className="text-xs font-bold text-gray-700 leading-tight">{section.label}</p>
                  {section.sublabel && (
                    <p className="text-2xs text-gray-400 mt-0.5">{section.sublabel}</p>
                  )}
                </td>

                {/* 월별 데이터 */}
                {data.months.map(m => (
                  <td key={m.month} className="border border-gray-200 align-top hover:bg-gray-50 transition-colors">
                    {section.key === 'sales'        && <SalesCell data={m} isCurrentMonth={m.month === currentMonth} />}
                    {section.key === 'promotion'    && <PromotionCell data={m} isCurrentMonth={m.month === currentMonth} />}
                    {section.key === 'product'      && <ProductCell data={m} isCurrentMonth={m.month === currentMonth} />}
                    {section.key === 'mainCampaign' && <CampaignCell data={m} isCurrentMonth={m.month === currentMonth} type="main" />}
                    {section.key === 'continuous'   && <CampaignCell data={m} isCurrentMonth={m.month === currentMonth} type="continuous" />}
                    {section.key === 'ugc'          && <UGCCell data={m} isCurrentMonth={m.month === currentMonth} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-xs text-green-700 font-medium">실시간</span>
    </div>
  )
}
