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
  id: 1, region: 2, brand: 3, market: 4, team: 5, owner: 6, type: 7, product: 8,
  hero: 9, title: 10, start: 11, end: 12, status: 13, budget: 14,
  channel: 15, issue: 16, risk: 17, updatedAt: 18, updatedBy: 19,
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

/**
 * 드롭다운(데이터 확인) 일괄 설정 — 에디터에서 한 번만 실행.
 * region/brand/type/hero/status/risk 열에 목록 제한을 걸어 오타 방지.
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
  const rows = 1000  // 2행부터 1001행까지 적용
  Object.keys(lists).forEach(col => {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(lists[col], true)
      .setAllowInvalid(false)
      .build()
    sheet.getRange(2, Number(col), rows, 1).setDataValidation(rule)
  })
  console.log('드롭다운 설정 완료')
}
