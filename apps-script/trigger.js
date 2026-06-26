/**
 * Google Apps Script — GTM 캘린더 자동화
 *
 * 역할:
 *  1) plans 탭 편집 시 → id·updated_at·updated_by 자동 기입
 *  2) 편집 즉시 Next.js 앱에 실시간 반영 알림(POST /api/refresh)
 *  3) 신규 행 추가 / 이슈·리스크 등록 시 → 이메일 알림
 *
 * 설치:
 *  1. Google Sheets → 확장 프로그램 → Apps Script
 *  2. 아래 코드 붙여넣고 APP_URL, SECRET, 이메일 설정 수정
 *  3. 트리거 → 트리거 추가 → onEditInstalled, 편집 시
 */

const APP_URL    = 'https://your-app.vercel.app'  // Vercel 배포 URL
const SECRET     = 'your_secret_token_here'        // .env의 REFRESH_SECRET과 동일
const SHEET_NAME = 'plans'

// ─── 알림 수신자 설정 ────────────────────────────────────────
// GTM팀 리드/매니저 — 모든 변경 알림 수신
const MANAGER_EMAILS = [
  'gtm-manager@company.com',
  // 'another.manager@company.com',
]

// 담당자(owner) 이름 → 이메일 매핑
// 스프레드시트의 F열(owner)에 입력된 이름과 정확히 일치해야 함
const TEAM_EMAILS = {
  '김지은':  'kim.jieun@company.com',
  '박서준':  'park.seojun@company.com',
  '이수민':  'lee.sumin@company.com',
  'Sarah K': 'sarah.k@company.com',
  '佐藤':    'sato@company.co.jp',
  '田中':    'tanaka@company.co.jp',
  '王伟':    'wang.wei@company.cn',
  '李娜':    'li.na@company.cn',
  '陈明':    'chen.ming@company.cn',
  // 이름 추가 시 여기에 등록
}
// ──────────────────────────────────────────────────────────────

const COL = {
  id: 1, region: 2, brand: 3, market: 4, team: 5, owner: 6, type: 7, product: 8,
  hero: 9, title: 10, start: 11, end: 12, status: 13, budget: 14,
  channel: 15, issue: 16, risk: 17, updatedAt: 18, updatedBy: 19,
}

function onEditInstalled(e) {
  const sheet = e.range.getSheet()
  if (sheet.getName() !== SHEET_NAME) return

  const row = e.range.getRow()
  if (row === 1) return  // 헤더

  const isNewRow = !sheet.getRange(row, COL.id).getValue()

  // 1) id 자동 부여 (비어있으면)
  if (isNewRow) {
    sheet.getRange(row, COL.id).setValue(nextId(sheet))
  }

  // 2) 수정 시각·수정자 자동 기입
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  sheet.getRange(row, COL.updatedAt).setValue(now)
  sheet.getRange(row, COL.updatedBy).setValue(Session.getActiveUser().getEmail() || '')

  // 3) 앱에 실시간 알림
  notifyApp()

  // 4) 이메일 알림 (비동기로 처리해 편집 속도에 영향 없게)
  sendEmailAlerts(sheet, row, e, isNewRow)
}

function sendEmailAlerts(sheet, row, e, isNewRow) {
  const rowData = sheet.getRange(row, 1, 1, 19).getValues()[0]
  const get = col => String(rowData[col - 1] || '').trim()

  const title   = get(COL.title)
  const product = get(COL.product)
  const region  = get(COL.region)
  const brand   = get(COL.brand)
  const owner   = get(COL.owner)
  const status  = get(COL.status)
  const issue   = get(COL.issue)
  const risk    = get(COL.risk)
  const start   = get(COL.start)
  const end     = get(COL.end)

  if (!title && !product) return  // 빈 행 무시

  const editedCol = e.range.getColumn()
  const sheetUrl  = SpreadsheetApp.getActiveSpreadsheet().getUrl()

  // 수신자: 매니저 + 담당자 (있을 경우)
  const recipients = [...MANAGER_EMAILS]
  const ownerEmail = TEAM_EMAILS[owner]
  if (ownerEmail && !recipients.includes(ownerEmail)) recipients.push(ownerEmail)
  if (!recipients.length) return

  // ── 케이스 1: 신규 활동 등록 ──
  if (isNewRow) {
    const subject = `[GTM캘린더] 신규 활동 등록 — ${brand} ${product}`
    const body = `
GTM 캘린더에 새 활동이 등록되었습니다.

▸ 활동명: ${title}
▸ 브랜드: ${brand}
▸ 권역:   ${region}
▸ 상품:   ${product}
▸ 기간:   ${start} ~ ${end}
▸ 담당자: ${owner}
▸ 상태:   ${status}
${issue ? `▸ 이슈:   ${issue} (위험도: ${risk})` : ''}

확인하기: ${sheetUrl}
    `.trim()
    sendMail(recipients, subject, body)
    return
  }

  // ── 케이스 2: 이슈/리스크 필드 변경 ──
  if (editedCol === COL.issue || editedCol === COL.risk) {
    if (!issue) return  // 이슈 삭제는 알림 제외
    const riskLabel = { '상': '🔴 높음', '중': '🟡 중간', '하': '🟢 낮음' }[risk] || risk
    const subject = `[GTM캘린더] 이슈 등록 — ${brand} ${product} (위험도: ${riskLabel})`
    const body = `
이슈/리스크가 등록되었습니다.

▸ 브랜드: ${brand}
▸ 권역:   ${region}
▸ 상품:   ${product}
▸ 활동명: ${title}
▸ 위험도: ${riskLabel}
▸ 이슈:   ${issue}
▸ 담당자: ${owner}

확인하기: ${sheetUrl}
    `.trim()
    sendMail(recipients, subject, body)
    return
  }

  // ── 케이스 3: 상태(status) 변경 ──
  if (editedCol === COL.status && status) {
    const subject = `[GTM캘린더] 상태 변경 — ${brand} ${product} → ${status}`
    const body = `
활동 상태가 변경되었습니다.

▸ 활동명: ${title}
▸ 브랜드: ${brand}
▸ 권역:   ${region}
▸ 상품:   ${product}
▸ 변경 후 상태: ${status}
▸ 담당자: ${owner}

확인하기: ${sheetUrl}
    `.trim()
    sendMail(recipients, subject, body)
  }
}

function sendMail(recipients, subject, body) {
  try {
    recipients.forEach(email => {
      if (email && email.includes('@')) {
        MailApp.sendEmail({ to: email, subject, body })
      }
    })
  } catch (err) {
    console.log('메일 발송 실패:', err.message)
  }
}

function nextId(sheet) {
  const ids = sheet.getRange(2, COL.id, Math.max(1, sheet.getLastRow() - 1), 1)
    .getValues().flat().filter(String)
  let max = 0
  ids.forEach(v => {
    const m = String(v).match(/(\d+)/)
    if (m) max = Math.max(max, parseInt(m[1]))
  })
  return 'P-' + String(max + 1).padStart(4, '0')
}

function notifyApp() {
  try {
    UrlFetchApp.fetch(`${APP_URL}/api/refresh?secret=${SECRET}`, {
      method: 'post', muteHttpExceptions: true,
    })
  } catch (err) {
    console.log('알림 실패:', err.message)
  }
}

// 에디터에서 직접 실행해 동작 확인
function testNotify() {
  notifyApp()
  console.log('앱 알림 테스트 완료')
}

// 이메일 발송 테스트 (Apps Script 에디터에서 직접 실행)
function testEmail() {
  const testRecipients = [Session.getActiveUser().getEmail()]
  sendMail(testRecipients, '[GTM캘린더] 이메일 테스트', '이메일 알림이 정상적으로 작동합니다.')
  console.log('테스트 이메일 발송 완료 →', testRecipients[0])
}

/**
 * 드롭다운(데이터 확인) 일괄 설정 — 에디터에서 한 번만 실행.
 */
function setupValidations() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
  if (!sheet) { console.log(SHEET_NAME + ' 탭을 찾을 수 없습니다'); return }

  const lists = {
    [COL.region]: ['국내', '미주', '중화권', '일본'],
    [COL.brand]:  ['웨이크메이크', '컬러그램', '바이오힐보'],
    [COL.type]:   ['신제품출시', '프로모션', '캠페인', '채널행사', '리뉴얼', '단종'],
    [COL.hero]:   ['Y', 'N'],
    [COL.status]: ['기획', '확정', '진행중', '완료', '보류', '취소'],
    [COL.risk]:   ['상', '중', '하'],
  }
  const rows = 1000
  Object.keys(lists).forEach(col => {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(lists[col], true)
      .setAllowInvalid(false)
      .build()
    sheet.getRange(2, Number(col), rows, 1).setDataValidation(rule)
  })
  console.log('드롭다운 설정 완료')
}
