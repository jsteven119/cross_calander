# GTM 캘린더 — 작업 핸드오프 문서

> 웹 세션에서 진행한 작업 맥락을 VS Code로 이어가기 위한 인수인계 문서입니다.
> VS Code에서 이 repo를 열고 Claude Code 확장에게 "HANDOFF.md 읽고 이어서 작업해줘"라고 하면 됩니다.

## 프로젝트 개요

다중 브랜드 뷰티 회사(웨이크메이크 / 컬러그램 / 바이오힐보)의 **실시간 GTM 캘린더 대시보드**.
Google Sheets에 입력한 데이터를 Next.js 앱이 실시간(SSE)으로 반영하고, Vercel로 배포.

- **프레임워크**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **데이터 소스**: Google Sheets API v4 (서비스 계정), `plans` 탭 19컬럼
- **실시간**: `/api/sse` + SWR + Apps Script `onEditInstalled` 트리거
- **배포**: `main` 브랜치 푸시 → Vercel 자동 배포
- **권역**: 국내 / 미주 / 중화권 / 일본

## 데이터 구조 (plans 탭, A~S 19컬럼)

| 열 | 필드 | 설명 |
|---|---|---|
| A | id | 자동 부여 (P-0001) |
| B | region | 국내/미주/중화권/일본 |
| C | brand | 웨이크메이크/컬러그램/바이오힐보 |
| D | market | 세부 시장 (미국-아마존 등) |
| E | team | 입력 팀 |
| F | owner | 담당자 |
| G | type | 신제품출시/프로모션/캠페인/채널행사/리뉴얼/단종 |
| H | product | 상품/라인명 |
| I | hero | 주력상품 여부 (Y/N) |
| J | title | 활동명 |
| K | start_date | YYYY-MM-DD |
| L | end_date | YYYY-MM-DD |
| M | status | 기획/확정/진행중/완료/보류/취소 |
| N | budget | 예산 (자유 텍스트) |
| O | channel | 채널 |
| P | issue | 이슈/리스크 내용 |
| Q | risk_level | 상/중/하 |
| R | updated_at | 자동 갱신 |
| S | updated_by | 자동 기입 |

## 주요 파일

| 파일 | 역할 |
|---|---|
| `src/lib/types.ts` | 데이터 모델, BRANDS 상수 |
| `src/lib/google-sheets.ts` | Sheets API 연동 + 샘플 데이터 |
| `src/lib/ui.ts` | 색상 스타일, 날짜 포맷 유틸 |
| `src/components/GTMDashboard.tsx` | 메인 레이아웃 (필터 사이드바 + 콘텐츠) |
| `src/components/Filters.tsx` | 좌측 세로 필터 사이드바 |
| `src/components/SwimlaneTimeline.tsx` | 권역별 타임라인(간트) |
| `src/components/Panels.tsx` | KPI/알림패널(탭)/EC보드/활동목록/상세드로어 |
| `src/components/SeedingBoard.tsx` | 인플루언서 시딩 스케줄 |
| `apps-script/trigger.js` | Sheets 자동화 + 이메일 알림 |

## 완료된 작업 이력

1. **기본 캘린더** — Google Sheets → Next.js SSE 실시간, 4권역
2. **Vercel 배포** — `main` 푸시 자동 배포
3. **UI 개선** — 글씨 확대, 타임라인 행 높이 증가, 활동 목록 테이블
4. **브랜드 필드** — brand 컬럼 추가, 브랜드 필터, 권역별 EC 프로모션 보드
5. **레이아웃 재구성** — 필터 좌측 사이드바, 캘린더 확대, EC 보드 상단 배치
6. **시딩 스케줄 보드** — 2026 3Q–4Q KR+JP 인플루언서 시딩 (529명 / ₩222M)
7. **알림 패널 탭 통합** — 충돌/이슈/변경 3개 패널 → 탭 1개
8. **이메일 알림** — Apps Script에서 신규등록·이슈·상태변경 시 담당자에게 발송

## 환경변수 (.env.local — VS Code에서 직접 설정 필요)

```
GOOGLE_SERVICE_ACCOUNT_KEY=<base64 인코딩된 서비스계정 JSON>
GOOGLE_SHEET_ID=<스프레드시트 ID>
GOOGLE_SHEET_NAME=plans
REFRESH_SECRET=<Apps Script와 공유하는 토큰>
```
> 환경변수가 없으면 `getSampleData()`의 샘플 데이터로 동작합니다.

## VS Code에서 이어가는 법

```bash
git clone <repo-url>
cd cross_calander
npm install
npm run dev          # http://localhost:3000
```

## 알려진 TODO / 후속 작업 후보

- [ ] 시딩 스케줄(`SeedingBoard`)을 별도 Google Sheets 탭과 실시간 연동
      (현재는 스프레드시트 기반 정적 샘플 데이터)
- [ ] Apps Script `TEAM_EMAILS` 매핑에 실제 팀원 이메일 입력
- [ ] 이메일 알림 → Slack 웹훅 알림 옵션 추가 검토
