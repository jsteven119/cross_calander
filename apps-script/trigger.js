/**
 * Google Apps Script — 시트 편집 시 Next.js 앱에 실시간 알림
 *
 * 설정 방법:
 * 1. Google Sheets → 확장 프로그램 → Apps Script 열기
 * 2. 아래 코드 전체 붙여넣기
 * 3. APP_URL, SECRET 값 수정
 * 4. 실행 → onEdit 함수 한 번 실행 (권한 허용)
 * 5. 트리거 → 트리거 추가 → onEdit, 스프레드시트에서, 편집 시
 */

const APP_URL = 'https://your-app.vercel.app' // Vercel 배포 URL로 변경
const SECRET  = 'your_secret_token_here'       // .env의 REFRESH_SECRET과 동일하게

function onEdit(e) {
  try {
    const url = `${APP_URL}/api/refresh?secret=${SECRET}`
    UrlFetchApp.fetch(url, {
      method: 'post',
      muteHttpExceptions: true,
    })
  } catch (err) {
    console.log('알림 전송 실패:', err.message)
  }
}

// 테스트용: Apps Script 에디터에서 직접 실행
function testTrigger() {
  onEdit({})
  console.log('테스트 완료')
}
