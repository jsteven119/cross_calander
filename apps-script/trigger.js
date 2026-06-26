/**
 * Google Apps Script — GTM 캘린더 자동화
 *
 * 두 가지 역할:
 *  1) plans 탭 편집 시 → id·updated_at·updated_by 자동 기입
 *  2) 편집 즉시 Next.js 앱에 실시간 반영 알림(POST /api/refresh)
 *
 * 설치:
 *  1. Google Sheets → 확장 프로그램 → Apps Script
 *  2. 아래 코드 붙여넣고 APP_URL, SECRET 수정
 *  3. 트리거 → 트리거 추가 → onEditInstalled, 편집 시
 *     (onEdit가 아니라 onEditInstalled로 등록해야 외부 fetch가 동작)
 */

const APP_URL    = 'https://your-app.vercel.app'  // Vercel 배포 URL
const SECRET     = 'your_secret_token_here'        // .env의 REFRESH_SECRET과 동일
const SHEET_NAME = 'plans'

// 열 위치 (1부터). plans 탭 헤더 순서와 일치해야 함.
const COL = {
  id: 1, region: 2, market: 3, team: 4, owner: 5, type: 6, product: 7,
  hero: 8, title: 9, start: 10, end: 11, status: 12, budget: 13,
  channel: 14, issue: 15, risk: 16, updatedAt: 17, updatedBy: 18,
}

function onEditInstalled(e) {
  const sheet = e.range.getSheet()
  if (sheet.getName() !== SHEET_NAME) return

  const row = e.range.getRow()
  if (row === 1) return  // 헤더

  // 1) id 자동 부여 (비어있으면)
  const idCell = sheet.getRange(row, COL.id)
  if (!idCell.getValue()) {
    idCell.setValue(nextId(sheet))
  }

  // 2) 수정 시각·수정자 자동 기입
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  sheet.getRange(row, COL.updatedAt).setValue(now)
  sheet.getRange(row, COL.updatedBy).setValue(Session.getActiveUser().getEmail() || '')

  // 3) 앱에 실시간 알림
  notifyApp()
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
  console.log('테스트 완료')
}
