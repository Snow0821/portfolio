# Current Decisions

## D-001 — 페이지 패키지 구조

- 상태: 적용
- 결정: 루트 `index.html` 외의 사용자 화면은 `pages/` 아래에 HTML, 초기화 JavaScript와 페이지 CSS를 함께 둔다.
- 이유: URL 진입점과 화면 전용 책임을 빠르게 찾고 공용 컴포넌트와 분리하기 위해서다.

## D-002 — 공통 CSS 계층

- 상태: 적용
- 결정: CSS는 `tokens → base → layouts → components → page.css` 순으로 의존한다.
- 이유: 페이지별 중복을 줄이고 공통 시각 언어를 유지하기 위해서다.

## D-003 — 현재 문서와 연도별 이력

- 상태: 적용
- 결정: 현재 사실은 네 개의 현재 문서에 유지하고 변경 과정은 `docs/history/<year>.md`에 기록한다.
- 이유: 최신 정보를 쉽게 찾으면서 작업과 결정의 배경도 보존하기 위해서다.

## D-004 — fnm과 Node.js 구조 검증기

- 상태: 적용
- 결정: Homebrew와 Docker 대신 `fnm`, `.node-version`과 `package.json`으로 Node.js 24를 선택하고 Node 표준 테스트 러너를 사용한다.
- 이유: 로컬 환경 충돌과 컨테이너 개발 마찰을 피하면서 Vercel 런타임과 개발 버전을 맞추기 위해서다.

## D-005 — Vercel Functions

- 상태: 적용
- 결정: 서버 기능은 루트 `api/*.mjs` Vercel Functions로 만들고 Vercel CLI는 프로젝트 의존성으로 고정하며 로컬 통합은 `npm run dev:vercel`로 실행한다.
- 이유: 정적 프런트엔드를 유지하면서 동일 저장소에서 API를 확장하고 로컬 통합 실행을 제공하기 위해서다.

## D-006 — 클라이언트 PDF와 인쇄 fallback

- 상태: 적용
- 결정: 세미나 PDF는 브라우저의 `html2pdf`로 생성하되 엔진을 사용할 수 없으면 같은 주제·모드의 인쇄 화면을 새 탭으로 연다.
- 이유: 별도 서버나 빌드 과정 없이 직접 다운로드를 제공하면서 외부 스크립트 차단 환경에서도 자료 출력을 유지하기 위해서다.
