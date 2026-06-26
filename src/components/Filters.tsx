'use client'

import type { GTMData, ActivityType, ActivityStatus } from '@/lib/types'
import { BRANDS } from '@/lib/types'

export interface FilterState {
  regions: Set<string>
  brands: Set<string>
  types: Set<string>
  statuses: Set<string>
  heroOnly: boolean
  product: string | null   // 상품 렌즈 (선택 시 해당 상품만 강조)
}

interface Props {
  data: GTMData
  filter: FilterState
  setFilter: (f: FilterState) => void
}

const TYPES: ActivityType[] = ['신제품출시', '프로모션', '캠페인', '채널행사', '리뉴얼', '단종']
const STATUSES: ActivityStatus[] = ['기획', '확정', '진행중', '완료', '보류', '취소']

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-2xs rounded-full px-2.5 py-1 border transition-colors
        ${active ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
    >
      {children}
    </button>
  )
}

function toggle(set: Set<string>, v: string): Set<string> {
  const n = new Set(set)
  n.has(v) ? n.delete(v) : n.add(v)
  return n
}

export function Filters({ data, filter, setFilter }: Props) {
  const products = Array.from(new Set(data.activities.map(a => a.product).filter(Boolean))).sort()

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-2xs text-gray-400 w-12">권역</span>
        {data.regions.map(r => (
          <Chip key={r.name} active={filter.regions.has(r.name)} onClick={() => setFilter({ ...filter, regions: toggle(filter.regions, r.name) })}>
            {r.name}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-2xs text-gray-400 w-12">브랜드</span>
        {BRANDS.map(b => (
          <Chip key={b} active={filter.brands.has(b)} onClick={() => setFilter({ ...filter, brands: toggle(filter.brands, b) })}>
            {b}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-2xs text-gray-400 w-12">유형</span>
        {TYPES.map(t => (
          <Chip key={t} active={filter.types.has(t)} onClick={() => setFilter({ ...filter, types: toggle(filter.types, t) })}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-2xs text-gray-400 w-12">상태</span>
        {STATUSES.map(s => (
          <Chip key={s} active={filter.statuses.has(s)} onClick={() => setFilter({ ...filter, statuses: toggle(filter.statuses, s) })}>
            {s}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-50">
        <label className="flex items-center gap-1.5 text-2xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.heroOnly}
            onChange={e => setFilter({ ...filter, heroOnly: e.target.checked })}
            className="accent-pink-500"
          />
          ★ 주력상품만
        </label>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-2xs text-gray-400">상품 렌즈</span>
          <select
            value={filter.product ?? ''}
            onChange={e => setFilter({ ...filter, product: e.target.value || null })}
            className="text-2xs border border-gray-200 rounded px-2 py-1 max-w-[160px]"
          >
            <option value="">전체 보기</option>
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

export function emptyFilter(): FilterState {
  return { regions: new Set(), brands: new Set(), types: new Set(), statuses: new Set(), heroOnly: false, product: null }
}
