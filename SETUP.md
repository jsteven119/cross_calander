# GTM 캘린더 설정 가이드

여러 팀·여러 권역이 **한 줄 = 한 활동**으로 입력하면, 대시보드가 전 권역 타임라인 ·
상품 충돌 · 이슈 · 변경 피드를 실시간으로 보여줍니다.

## 스프레드시트 구조

### `plans` 탭 (모든 팀이 입력하는 메인)

1행은 헤더, 2행부터 한 줄에 한 활동을 입력합니다.

| 열 | 헤더 | 설명 | 예시 |
|---|---|---|---|
| A | id | **자동** (Apps Script) | P-0001 |
| B | region | 권역 (드롭다운) | 국내 / 미주 / 중화권 / 일본 |
| C | market | 세부 시장·채널 | 미국-아마존 |
| D | team | 입력 팀 | 미주팀 |
| E | owner | 담당자 | Sarah K |
| F | type | 활동유형 (드롭다운) | 신제품출시 / 프로모션 / 캠페인 / 채널행사 / 리뉴얼 / 단종 |
| G | product | 상품·라인명 | 헬로키티 컬렉션 |
| H | hero | 주력여부 | Y / N |
| I | title | 활동명 | Hello Kitty US Launch |
| J | start_date | 시작일 | 2026-04-20 |
| K | end_date | 종료일 | 2026-06-15 |
| L | status | 상태 (드롭다운) | 기획 / 확정 / 진행중 / 완료 / 보류 / 취소 |
| M | budget | 예산 (자유 텍스트) | $120K |
| N | channel | 채널 | Amazon |
| O | issue | 이슈·리스크 내용 | 통관 지연 가능성 |
| P | risk_level | 이슈 심각도 | 상 / 중 / 하 |
| Q | updated_at | **자동** | (Apps Script) |
| R | updated_by | **자동** | (Apps Script) |

> `gtm_plans_template.csv`를 Google Sheets에 **가져오기**하면 헤더+예시가 채워집니다.

### 여러 팀 동시 입력을 위한 권장 설정

- **드롭다운(데이터 확인)**: B(region)·F(type)·L(status)·P(risk)은 목록으로 제한 → 오타로 값 갈라짐 방지
- **id·updated_at·updated_by 자동**: Apps Script가 채움 (직접 입력 X)
- **병합 셀 금지**: 동시 편집 시 깨짐
- **팀별 필터뷰**: 각 팀이 자기 권역만 걸러봐도 원본 안 건드림 (데이터 → 필터 보기)

### (선택) `regions` 탭 — 권역 색상 커스터마이징

| A (name) | B (color) | C (order) |
|---|---|---|
| 국내 | #ec4899 | 0 |
| 미주 | #3b82f6 | 1 |

없으면 기본 6개 권역·색상을 자동 사용합니다.

---

## Google Sheets API 연동

1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 생성
2. **Google Sheets API** 활성화
3. **서비스 계정** 생성 → JSON 키 다운로드
4. Base64 인코딩: `base64 -i service-account.json | tr -d '\n'`
5. 스프레드시트 **공유** → 서비스 계정 이메일 추가 (뷰어)

### 환경변수 (.env.local)

```env
GOOGLE_SERVICE_ACCOUNT_KEY=base64_인코딩된_JSON
GOOGLE_SHEET_ID=스프레드시트_ID
GOOGLE_SHEET_NAME=plans
REFRESH_SECRET=임의의_비밀_문자열
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 실시간 반영 (Apps Script)

1. Google Sheets → 확장 프로그램 → Apps Script
2. `apps-script/trigger.js` 붙여넣고 `APP_URL`·`SECRET` 수정
3. 트리거 추가: **onEditInstalled** → 스프레드시트 편집 시
   - (외부 fetch가 필요하므로 단순 onEdit 아닌 설치형 트리거로 등록)

편집 → id·시각 자동기입 → 앱에 알림 → 모든 접속 브라우저 1~3초 내 갱신.

---

## 배포 (Vercel)

```bash
npx vercel --prod
```

Vercel 대시보드에서 환경변수 동일하게 등록. (SSE 실시간 기능 때문에 Cloudflare Pages 대신 Vercel 권장)

---

## 대시보드 기능

| 화면 | 해결하는 문제 |
|---|---|
| **권역 스윔레인 타임라인** | 전 권역이 언제 뭘 하는지 한 화면에 |
| **상품 충돌 감지** | 같은 주력상품이 여러 권역에서 기간 겹침 자동 표시 |
| **상품 렌즈** | 상품 하나 선택 → 그 상품만 전 권역 추적 |
| **이슈·리스크 보드** | 이슈 있는 활동을 심각도순으로 |
| **최근 변경 피드** | 누가 방금 뭘 바꿨는지 실시간 |
| **KPI 스트립** | 진행중·주력런칭·충돌·고위험 요약 |
