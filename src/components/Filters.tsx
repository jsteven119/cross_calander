'use client'

import type { GTMData, ActivityType, ActivityStatus } from '@/lib/types'
import { BRANDS } from '@/lib/types'

export interface FilterState {
  regions: Set<string>
  brands: Set<string>
  retails: Set<string>     // 리테일 (Qoo10/RKT/@cosme …)
  types: Set<string>
  statuses: Set<string>
  months: Set<number>      // 시작월 (1~12)
  heroOnly: boolean
  product: string | null   // 상품 렌즈 (선택 시 해당 상품만 강조)
}

interface Props {
  data: GTMData
  filter: FilterState
  setFilter: (f: FilterState) => void
}

const TYPES: ActivityType[] = ['프로모션', '바이럴', '신상품', '상시']
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

function toggleNum(set: Set<number>, v: number): Set<number> {
  const n = new Set(set)
  n.has(v) ? n.delete(v) : n.add(v)
  return n
}

function startMonth(d: string): number | null {
  const m = (d || '').match(/^\d{4}\D+(\d{1,2})/)
  return m ? +m[1] : null
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

export function Filters({ data, filter, setFilter }: Props) {
  const products = Array.from(new Set(data.activities.map(a => a.product).filter(Boolean))).sort()
  const retails = Array.from(new Set(data.activities.map(a => a.retail).filter(Boolean))).sort()
  // 데이터에 실제로 존재하는 시작월만 칩으로 노출
  const months = Array.from(new Set(data.activities.map(a => startMonth(a.startDate)).filter((m): m is number => m !== null))).sort((a, b) => a - b)
  const hasFilter = filter.regions.size || filter.brands.size || filter.retails.size || filter.types.size || filter.statuses.size || filter.months.size || filter.heroOnly || filter.product

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">필터</span>
        {hasFilter ? (
          <button
            onClick={() => setFilter(emptyFilter())}
            className="text-2xs text-gray-400 hover:text-gray-600"
          >
            초기화
          </button>
        ) : null}
      </div>

      <Section label="권역">
        {data.regions.map(r => (
          <Chip key={r.name} active={filter.regions.has(r.name)} onClick={() => setFilter({ ...filter, regions: toggle(filter.regions, r.name) })}>
            {r.name}
          </Chip>
        ))}
      </Section>

      <Section label="월">
        {months.map(m => (
          <Chip key={m} active={filter.months.has(m)} onClick={() => setFilter({ ...filter, months: toggleNum(filter.months, m) })}>
            {m}월
          </Chip>
        ))}
      </Section>

      <Section label="브랜드">
        {BRANDS.map(b => (
          <Chip key={b} active={filter.brands.has(b)} onClick={() => setFilter({ ...filter, brands: toggle(filter.brands, b) })}>
            {b}
          </Chip>
        ))}
      </Section>

      {retails.length > 0 && (
        <Section label="리테일">
          {retails.map(rt => (
            <Chip key={rt} active={filter.retails.has(rt)} onClick={() => setFilter({ ...filter, retails: toggle(filter.retails, rt) })}>
              {rt}
            </Chip>
          ))}
        </Section>
      )}

      <Section label="유형">
        {TYPES.map(t => (
          <Chip key={t} active={filter.types.has(t)} onClick={() => setFilter({ ...filter, types: toggle(filter.types, t) })}>
            {t}
          </Chip>
        ))}
      </Section>

      <Section label="상태">
        {STATUSES.map(s => (
          <Chip key={s} active={filter.statuses.has(s)} onClick={() => setFilter({ ...filter, statuses: toggle(filter.statuses, s) })}>
            {s}
          </Chip>
        ))}
      </Section>

      <div className="pt-2 border-t border-gray-100 space-y-2">
        <label className="flex items-center gap-1.5 text-2xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.heroOnly}
            onChange={e => setFilter({ ...filter, heroOnly: e.target.checked })}
            className="accent-pink-500"
          />
          ★ 주력상품만
        </label>
        <div className="space-y-1">
          <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">상품 렌즈</p>
          <select
            value={filter.product ?? ''}
            onChange={e => setFilter({ ...filter, product: e.target.value || null })}
            className="w-full text-2xs border border-gray-200 rounded px-2 py-1.5"
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
  return { regions: new Set(), brands: new Set(), retails: new Set(), types: new Set(), statuses: new Set(), months: new Set(), heroOnly: false, product: null }
}
