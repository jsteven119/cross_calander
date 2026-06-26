'use client'

// 인플루언서 시딩 스케줄 보드
// 데이터 출처: 시딩 스케줄 스프레드시트 (2026 3Q/4Q)

const BRAND_COLOR: Record<string, string> = {
  '웨이크메이크': 'bg-pink-500',
  '컬러그램': 'bg-violet-500',
  '필리밀리': 'bg-emerald-500',
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  planned:    { label: '예정', cls: 'bg-gray-100 text-gray-500' },
  recruiting: { label: '모집중', cls: 'bg-blue-100 text-blue-700' },
  shipped:    { label: '발송완료', cls: 'bg-amber-100 text-amber-700' },
  uploaded:   { label: '업로드완료', cls: 'bg-green-100 text-green-700' },
}

interface SeedingBatch {
  month: string
  brand: string
  region: 'KR' | 'JP'
  product: string
  quantity: number
  milestoneDate: string
  status: keyof typeof STATUS_LABEL
}

// 2026 3Q/4Q 시딩 스케줄 샘플 데이터 (스프레드시트 기반)
const SEEDING_DATA: SeedingBatch[] = [
  // 7월 (KR 46명)
  { month: '7월', brand: '컬러그램',   region: 'KR', product: '포켓링 아이 팔레트 + 애교살 메이커', quantity: 20, milestoneDate: '2026-07-06', status: 'shipped' },
  { month: '7월', brand: '웨이크메이크', region: 'KR', product: '소블밤 + 헬글밤 + 볼드립',            quantity: 20, milestoneDate: '2026-07-06', status: 'shipped' },
  { month: '7월', brand: '필리밀리',    region: 'KR', product: '노글루 01 트리플A',                   quantity: 6,  milestoneDate: '2026-07-10', status: 'planned' },
  // 8월 (KR 67명)
  { month: '8월', brand: '컬러그램',   region: 'KR', product: '애교살 메이커 AD 03/11/12호',          quantity: 15, milestoneDate: '2026-07-01', status: 'recruiting' },
  { month: '8월', brand: '컬러그램',   region: 'KR', product: '누디블러틴트 03 피그블리 / 21 쿨타로즈', quantity: 9,  milestoneDate: '2026-07-11', status: 'shipped' },
  { month: '8월', brand: '컬러그램',   region: 'KR', product: '누디블러스틱 신규 호수',               quantity: 6,  milestoneDate: '2026-08-01', status: 'planned' },
  { month: '8월', brand: '웨이크메이크', region: 'KR', product: 'NEW 쿠션 19/21/22호',                 quantity: 31, milestoneDate: '2026-08-21', status: 'planned' },
  { month: '8월', brand: '필리밀리',    region: 'KR', product: '노글루 3종',                          quantity: 6,  milestoneDate: '2026-08-05', status: 'planned' },
  // 9월 (KR 67명)
  { month: '9월', brand: '웨이크메이크', region: 'KR', product: '헬글밤 19 쉘피치 / 소블밤 캔디코랄',  quantity: 10, milestoneDate: '2026-09-05', status: 'planned' },
  { month: '9월', brand: '웨이크메이크', region: 'KR', product: '기능아이CAT 철벽펜 + 소블아',         quantity: 10, milestoneDate: '2026-09-05', status: 'planned' },
  { month: '9월', brand: '컬러그램',   region: 'KR', product: '볼드 블러 틴트 신규 라인',            quantity: 20, milestoneDate: '2026-09-10', status: 'planned' },
  { month: '9월', brand: '필리밀리',    region: 'KR', product: '노글루 3종 (베스트호수)',             quantity: 6,  milestoneDate: '2026-09-01', status: 'planned' },
  // 7월 JP
  { month: '7월', brand: '웨이크메이크', region: 'JP', product: '소블아 (자율)',                       quantity: 13, milestoneDate: '2026-07-01', status: 'shipped' },
  { month: '8월', brand: '웨이크메이크', region: 'JP', product: '심리스 고정 + 쉐딩 스틱',             quantity: 29, milestoneDate: '2026-08-01', status: 'planned' },
  { month: '11월', brand: '웨이크메이크', region: 'JP', product: '컬러커버 신규',                      quantity: 20, milestoneDate: '2026-11-01', status: 'planned' },
]

const MONTHLY_SUMMARY = [
  { month: '7월',  total: 73,  budget: '3,069' },
  { month: '8월',  total: 117, budget: '4,924' },
  { month: '9월',  total: 77,  budget: '3,228' },
  { month: '10월', total: 77,  budget: '3,228' },
  { month: '11월', total: 110, budget: '4,627' },
  { month: '12월', total: 75,  budget: '3,144' },
]

const MONTHS = MONTHLY_SUMMARY.map(m => m.month)
const MAX_TOTAL = Math.max(...MONTHLY_SUMMARY.map(m => m.total))

export function SeedingBoard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-indigo-500">✦</span>
        <h3 className="text-sm font-bold text-gray-800">인플루언서 시딩 스케줄</h3>
        <span className="text-2xs text-gray-400">2026 3Q–4Q · KR+JP</span>
        <span className="ml-auto text-2xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
          총 529명 / ₩222M
        </span>
      </div>

      {/* 월별 인원 막대 요약 */}
      <div className="grid grid-cols-6 divide-x divide-gray-100 border-b border-gray-100">
        {MONTHLY_SUMMARY.map(s => (
          <div key={s.month} className="p-2.5 flex flex-col items-center gap-1">
            <span className="text-2xs font-semibold text-gray-600">{s.month}</span>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${(s.total / MAX_TOTAL) * 100}%` }}
              />
            </div>
            <span className="text-2xs text-gray-700 font-bold">{s.total}명</span>
            <span className="text-2xs text-gray-400">₩{s.budget}만</span>
          </div>
        ))}
      </div>

      {/* 월별 × 브랜드 시딩 배치 목록 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-gray-400">
              <th className="font-medium px-3 py-2 text-left w-16">월</th>
              <th className="font-medium px-3 py-2 text-left w-24">브랜드</th>
              <th className="font-medium px-3 py-2 text-left w-12">권역</th>
              <th className="font-medium px-3 py-2 text-left">제품</th>
              <th className="font-medium px-3 py-2 text-right w-16">수량</th>
              <th className="font-medium px-3 py-2 text-center w-28">업로드 시작</th>
              <th className="font-medium px-3 py-2 text-center w-24">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MONTHS.map(month => {
              const batches = SEEDING_DATA.filter(d => d.month === month)
              if (!batches.length) return null
              return batches.map((d, i) => {
                const st = STATUS_LABEL[d.status]
                return (
                  <tr key={`${month}-${i}`} className="hover:bg-indigo-50/50 transition-colors">
                    {i === 0 ? (
                      <td className="px-3 py-2 text-gray-500 font-semibold align-top" rowSpan={batches.length}>
                        {month}
                      </td>
                    ) : null}
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${BRAND_COLOR[d.brand] ?? 'bg-gray-400'}`} />
                        {d.brand}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{d.region}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[260px] truncate">{d.product}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-700">{d.quantity}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{d.milestoneDate.slice(5).replace('-', '/')}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-2xs rounded-full px-2 py-0.5 ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                )
              })
            })}
          </tbody>
        </table>
      </div>

      {/* 브랜드 범례 */}
      <div className="flex flex-wrap gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        {Object.entries(BRAND_COLOR).map(([brand, cls]) => (
          <span key={brand} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />{brand}
          </span>
        ))}
        <span className="ml-auto text-2xs text-gray-400">단가: KR ₩418,500 · JP ₩424,000/건</span>
      </div>
    </div>
  )
}
