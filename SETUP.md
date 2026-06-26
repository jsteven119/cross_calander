# 실시간 제품 캘린더 설정 가이드

## 1. Google Sheets API 서비스 계정 만들기

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 (또는 기존 프로젝트 선택)
3. **API 및 서비스 → 라이브러리** → "Google Sheets API" 활성화
4. **API 및 서비스 → 사용자 인증 정보** → 서비스 계정 만들기
5. 서비스 계정 선택 → **키** 탭 → JSON 키 다운로드
6. 다운받은 JSON 파일을 Base64 인코딩:
   ```bash
   base64 -i service-account.json | tr -d '\n'
   ```
7. 출력값을 `GOOGLE_SERVICE_ACCOUNT_KEY` 환경변수로 설정

## 2. 스프레드시트 공유

1. Google Sheets 문서 열기
2. **공유** → 서비스 계정 이메일 추가 (뷰어 권한으로 충분)
3. URL에서 Sheet ID 복사:
   `https://docs.google.com/spreadsheets/d/[이 부분]/edit`

## 3. 환경변수 설정 (.env.local)

```env
GOOGLE_SERVICE_ACCOUNT_KEY=base64_인코딩된_JSON
GOOGLE_SHEET_ID=스프레드시트_ID
GOOGLE_SHEET_NAME=2026 플래너
REFRESH_SECRET=임의의_비밀_문자열_32자이상
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 4. Google Apps Script 설정 (실시간 반영)

1. Google Sheets → 확장 프로그램 → Apps Script
2. `apps-script/trigger.js` 내용 붙여넣기
3. `APP_URL`과 `SECRET` 값 수정
4. 트리거 추가: **onEdit** → 스프레드시트 편집 시

## 5. Vercel 배포

```bash
npm i -g vercel
vercel --prod
```

Vercel 대시보드에서 환경변수 동일하게 설정.

## 스프레드시트 구조 (시트가 아래 형식이어야 파싱됨)

| 열 A (카테고리) | 열 B (1월) | ... | 열 M (12월) |
|----------------|-----------|-----|------------|
| 브랜드 전체 매출고 | 7159 | ... | 9964 |
| 국내 | 5560 | ... | 7936 |
| 주요 프로모션 | 홈쇼핑: ... | ... | |
| 주요 상품 | 립스틱(11) | ... | |
| 주력 캠페인 | 캠페인명 | ... | |
| 상시 캠페인 | ... | ... | |
| UGC 콘텐츠 | ... | ... | |

> 정확한 카테고리명이 다를 경우 `src/lib/google-sheets.ts`의 `findRow()` 키워드 수정
