# Project Conventions

## 페이지

- 루트 `index.html` 외의 URL 진입 화면은 `pages/<page-name>/` 아래에 둔다.
- 페이지 패키지는 HTML, `page.js`, `page.css`를 기본 단위로 사용한다.
- `page.js`는 데이터 선택, URL 해석, 컴포넌트 조립과 생명주기 시작만 담당한다.
- 두 화면 이상에서 재사용하는 렌더링이나 상호작용은 `components/`로 승격한다.

## 컴포넌트와 서비스

- 컴포넌트는 특정 페이지 URL을 하드코딩하지 않고 입력으로 링크나 callback을 받는다.
- DOM 표현과 분리할 수 있는 기능은 `services/`에 둔다.
- 임시 DOM이나 외부 리소스를 만드는 서비스는 성공과 실패 모든 경로에서 정리한다.
- PDF 내보내기처럼 외부 브라우저 라이브러리에 의존하는 기능은 사용할 수 없을 때의 fallback을 제공한다.
- 데이터 모듈은 DOM, 페이지, 컴포넌트와 서비스에 의존하지 않는다.

## CSS

- 공통 의존 순서는 `tokens → base → layouts → components → page.css`다.
- 모든 화면은 `styles/main.css`를 먼저 사용한다.
- 같은 스타일이 두 페이지에서 필요하면 공통 레이아웃이나 컴포넌트 스타일로 옮긴다.
- `page.css`는 전역 태그의 기본 표현을 재정의하지 않는다.
- `!important`는 인쇄 매체처럼 우선순위 재정의가 불가피한 경우에만 사용한다.

## 접근성과 콘텐츠

- 아이콘만 있는 버튼은 동작 대상과 형식을 포함한 `aria-label`을 제공한다.
- 현재 페이지 링크에는 `aria-current="page"`를 사용한다.
- 제목 순서와 landmark를 유지하고, Markdown 문법을 HTML 텍스트에 그대로 넣지 않는다.
- 코드로 렌더링하는 일반 문자열은 신뢰된 로컬 데이터만 사용하며 외부 입력은 `innerHTML`에 직접 넣지 않는다.

## 개발 환경과 검증

- Node.js 버전은 `.node-version`과 `package.json#engines.node`에서 `24.x`로 유지한다.
- 의존성 설치는 `npm install`, 구조와 동작 검증은 `npm test`를 사용한다.
- 정적 화면만 빠르게 확인할 때는 `python3 -m http.server 4173`을 사용할 수 있다.
- Vercel Functions까지 확인할 때는 `npm run dev`를 사용한다.
- 새 동작이나 버그 수정은 실패하는 테스트를 먼저 확인한 후 최소 구현으로 통과시킨다.
- URL 진입점이나 CSS import를 바꾸면 존재하지 않는 로컬 참조와 금지된 레거시 경로가 없는지 자동 검증한다.

## 문서와 이력

- 현재 구조는 `architecture.md`, 규칙은 `conventions.md`, 장기 결정은 `decisions.md`, 진행 상태는 `status.md`에 유지한다.
- 프로젝트 파일을 변경한 작업은 `history/<year>.md`에 요청, 문제, 결정, 수행, 검증 결과와 남은 작업을 기록한다.
- 현재 문서에는 과거 설명을 누적하지 않고 대체된 내용은 연도별 이력에 보존한다.
- 작업마다 별도 로그나 ADR 파일을 만들지 않는다.
