# GTM 캘린더

여러 팀·여러 권역(국내/미주/중화권/일본/동남아/EU)의 GTM 활동을 **실시간으로 공유**하는
통합 캘린더. 서로 어떤 상품을 언제 진행하는지, 어디서 충돌·이슈가 나는지 한눈에 봅니다.

## 무엇을 해결하나

- **서로 뭘 하는지 모름** → 전 권역 스윔레인 타임라인 한 화면
- **주력 상품 변동 심함** → 상품 렌즈로 권역 넘나들며 추적 + 변경 피드
- **어떤 문제 있는지 모름** → 충돌 자동 감지 + 이슈·리스크 보드

## 구조

```
Google Sheets (plans 탭, 팀별 입력)
  → Apps Script onEdit (id·시각 자동 + 알림)
  → Next.js /api/refresh
  → SSE 로 모든 브라우저 실시간 갱신
  → 대시보드 (타임라인·충돌·이슈·피드)
```

데이터는 **한 줄 = 한 활동** long format. 화면은 그 데이터를 읽어 그리는 결과물.

## 시작

```bash
npm install
npm run dev    # http://localhost:3000 (환경변수 없으면 샘플 데이터)
```

연동·배포는 [SETUP.md](./SETUP.md) 참고.

## 기술 스택

- Next.js 14 (App Router) · React · TypeScript · Tailwind
- Google Sheets API (데이터 소스)
- SSE (실시간) · SWR (캐싱/폴백)
- 배포: Vercel
