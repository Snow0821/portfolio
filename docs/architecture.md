# Portfolio Architecture

## 1. 목적

이 프로젝트의 프런트엔드는 별도의 빌드 결과물 없이 Vercel에 배포할 수 있는 순수 정적 사이트를 유지한다. `index.html`을 제외한 모든 화면은 `pages/` 아래에서 명시적인 페이지 패키지를 가지며, 실제 구현은 재사용 가능한 컴포넌트를 중심으로 구성한다. 로컬 개발과 검증은 `fnm`으로 선택한 Node.js 24와 프로젝트 로컬 Vercel CLI로 통일하고, 서버 기능은 루트 `api/`의 Vercel Functions로 확장한다.

구조가 확장되더라도 다음 질문에 빠르게 답할 수 있어야 한다.

- URL로 직접 열리는 화면은 어디에 있는가?
- 특정 UI와 동작을 담당하는 컴포넌트는 어디에 있는가?
- 여러 페이지가 공유하는 스타일은 어디에 있는가?
- 현재 문제와 다음 작업은 무엇인가?
- 구조와 규칙이 왜 이렇게 결정되었는가?
- 과거 작업에서 무엇을 발견하고 변경했는가?

## 2. 필수 원칙

### 2.1 정적 사이트 유지

- 프런트엔드 배포에 번들러, 프레임워크 또는 별도 애플리케이션 서버를 요구하지 않는다.
- 페이지는 표준 HTML, CSS, JavaScript ES module만으로 실행한다.
- 모든 경로는 정적 파일 서버에서 직접 해석할 수 있어야 한다.
- API 기능은 Vercel이 직접 빌드하고 실행하는 `api/*.mjs` Vercel Functions로 제공한다.

### 2.2 개발 환경과 배포 환경 분리

- 로컬 Node.js는 Homebrew나 시스템 고정 설치 대신 `fnm`으로 관리한다.
- 프로젝트 루트의 `.node-version`과 `package.json#engines.node`를 `24.x`로 맞춘다.
- Vercel CLI는 전역 설치하지 않고 프로젝트 `devDependencies`에 고정한다.
- 로컬 정적 페이지와 Vercel Functions 통합 실행에는 `vercel dev`를 사용한다.
- Docker와 `Dockerfile.vercel`은 현재 개발 및 운영 흐름에 도입하지 않는다.
- 운영과 Preview 배포는 Git 저장소를 연결한 Vercel의 기본 배포 흐름을 유지한다.
- 프런트엔드 번들링이 실제 요구사항이 되기 전에는 Vite와 별도 `dist/` 빌드 단계를 추가하지 않는다.

참고: [Vercel CLI 로컬 개발](https://vercel.com/docs/cli/dev.rsc), [Vercel Functions Node.js 런타임](https://vercel.com/docs/functions/runtimes/node-js), [Vercel 지원 Node.js 버전](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

### 2.3 페이지 패키지와 컴포넌트 중심 구현

- 루트 `index.html`은 프로젝트의 유일한 예외 진입 페이지다.
- 그 외 URL 진입 화면은 `pages/<page-name>/` 아래에 둔다.
- 각 페이지 패키지는 HTML, 초기화 JavaScript, 페이지 전용 CSS를 함께 가진다.
- 페이지 모듈은 조립과 초기화만 담당한다.
- 재사용 가능한 마크업, 상태, 이벤트 동작은 `components/`에 둔다.
- PDF 생성처럼 UI가 아닌 기능은 `services/`에 둔다.
- 화면과 독립적인 콘텐츠 데이터는 `data/`에 둔다.

### 2.4 공통 CSS 우선

CSS 의존 순서는 다음과 같다.

```text
tokens → base → layouts → components → page.css
```

- 모든 페이지는 `styles/main.css`를 공통 진입점으로 사용한다.
- `page.css`에는 해당 화면에만 필요한 배치와 예외만 둔다.
- 같은 규칙이 두 개 이상의 페이지에서 필요하면 공통 레이아웃 또는 컴포넌트 스타일로 승격한다.
- 공통 CSS는 페이지 전용 CSS에 의존하지 않는다.
- `page.css`는 전역 태그의 기본 표현을 재정의하지 않는다.
- `!important`는 인쇄처럼 별도의 표현 매체에서 우선순위를 강제로 재정의해야 하는 경우에만 허용한다.

### 2.5 모든 작업에 문서화 동반

프로젝트 파일을 변경하는 모든 작업은 같은 작업 범위 안에서 관련 문서와 작업 이력을 함께 갱신해야 한다. 문서화가 끝나지 않은 작업은 완료로 간주하지 않는다.

최소 요구사항은 다음과 같다.

1. `docs/history/<year>.md`에 요청, 문제, 결정, 수행 내용, 검증 결과, 남은 작업을 기록한다.
2. 구조가 변하면 `docs/architecture.md`를 갱신한다.
3. 구현 규칙이 변하면 `docs/conventions.md`를 갱신한다.
4. 장기적으로 영향을 주는 결정이 변하면 `docs/decisions.md`를 갱신한다.
5. 현재 문제, 다음 작업 또는 완료 상태가 변하면 `docs/status.md`를 갱신한다.
6. 실행한 자동 테스트와 브라우저 검증 결과를 작업 이력에 남긴다.

단순한 읽기, 설명 또는 프로젝트 파일을 변경하지 않는 검토는 새 이력을 강제하지 않는다. 다만 검토 결과를 프로젝트 피드백으로 보존해 달라는 요청이 있으면 반드시 기록한다.

### 2.6 책임 기반 모듈화

- 파일 수가 아니라 하나의 책임, 독립 변경과 독립 검증 가능성을 모듈 경계로 사용한다.
- 실행 코드, CSS와 테스트는 200줄 이하를 권장하고 300줄을 넘는 파일은 분리하거나 예외 근거를 문서화한다.
- 콘텐츠 데이터, 문서와 이력은 줄 수 기준에서 제외하지만 구조적 복잡성이 커지면 책임에 따라 분리한다.
- 파일이 세 개 이상이거나 공개 계약, 생명주기 또는 의존 방향이 복잡한 기능은 디렉터리 README로 모듈 사용법을 설명한다.
- 공개 함수의 작은 계약은 JSDoc으로 설명하고 파일별 설명 문서는 만들지 않는다.

## 3. 현재 디렉터리 구조

```text
portfolio/
├── index.html
├── AGENTS.md
├── README.md
├── .node-version
├── .gitignore
├── package.json
├── package-lock.json
│
├── api/
│   └── health.mjs
│
├── pages/
│   ├── seminars/
│   │   ├── index.html
│   │   ├── page.js
│   │   └── page.css
│   └── presentation/
│       ├── horizontal.html
│       ├── vertical.html
│       ├── page.js
│       └── page.css
│
├── components/
│   ├── section-include.js
│   ├── site-header.js
│   ├── slide-header.js
│   ├── seminar-list.js
│   ├── document-renderer.js
│   ├── slide-renderer.js
│   └── presentation-controller.js
│
├── services/
│   └── pdf-exporter.js
│
├── data/
│   ├── seminars.js
│   └── topics/
│
├── content/
│   └── home/
│       ├── about.html
│       ├── research.html
│       ├── career.html
│       └── academic.html
│
├── styles/
│   ├── main.css
│   ├── tokens.css
│   ├── base.css
│   ├── layouts.css
│   ├── print.css
│   └── components/
│       ├── site-header.css
│       ├── content-section.css
│       ├── entry.css
│       ├── seminar-card.css
│       └── presentation.css
│
├── docs/
│   ├── architecture.md
│   ├── conventions.md
│   ├── decisions.md
│   ├── status.md
│   ├── superpowers/
│   │   └── specs/          # 작업 중인 임시 설계 사양
│   └── history/
│       └── 2026.md
│
└── tests/
    └── verify-structure.mjs
```

## 4. 영역별 책임

### `pages/`

URL로 직접 열리는 화면을 소유한다. 각 페이지의 HTML은 콘텐츠가 들어갈 마운트 지점과 페이지 진입 모듈만 선언한다. `page.js`는 데이터 선택, 컴포넌트 조립, 페이지 생명주기 시작을 담당하며 재사용 가능한 렌더링 로직을 직접 구현하지 않는다.

### `components/`

독립적인 UI 또는 사용자 상호작용 단위를 소유한다. 각 컴포넌트는 입력, 출력, 의존성을 코드만 읽지 않아도 설명할 수 있어야 한다. 특정 페이지 URL이나 페이지 전용 CSS에 의존하지 않는다.

### `services/`

PDF 내보내기처럼 UI 표현과 분리할 수 있는 기능을 소유한다. 임시 리소스를 생성하는 서비스는 성공과 실패 여부에 관계없이 정리 책임까지 가진다.

### `api/`

Vercel Functions 진입점을 소유한다. 각 `.mjs` 파일은 독립적인 HTTP API 계약을 제공하며 브라우저 전용 모듈에 의존하지 않는다. 첫 함수인 `/api/health`는 로컬 `vercel dev`와 Vercel Preview 환경의 통합 상태를 검증하는 smoke endpoint다.

### `data/`

세미나 목록과 주제 콘텐츠를 소유한다. 페이지, 컴포넌트, 서비스 또는 DOM에 의존하지 않는다. 세미나 콘텐츠의 단일 출처다.

### `content/`

데이터 객체로 표현하지 않는 정적 HTML 콘텐츠를 소유한다. 홈 화면의 비동기 섹션 조각은 `content/home/`에 둔다.

### `styles/`

프로젝트 전체의 시각 언어와 공통 표현을 소유한다. 토큰, 기본 요소, 공통 레이아웃, 컴포넌트 스타일 순으로 의존한다. 페이지별 예외는 각 페이지 패키지의 `page.css`에 둔다.

### `docs/`

현재 구조, 현재 규칙, 현재 상태, 현재 결정과 압축된 변경 이력을 소유한다. 현재 문서에는 과거 설명을 누적하지 않고, 과거 내용은 연도별 이력에 보존한다. 복잡한 미래 시스템의 승인 전 설계와 새 세션 핸드오프는 `docs/superpowers/specs/`에 두며 작업별 로그나 ADR을 대신하지 않는다.

## 5. 의존 방향

허용되는 기본 의존 방향은 다음과 같다.

```text
page → component → service/data
page.css → shared styles
component → component
service → data 또는 전달받은 DOM 렌더러
api → 서버 전용 유틸리티 또는 외부 서비스
```

다음 역방향 의존은 금지한다.

- 공용 컴포넌트가 특정 페이지 모듈을 import하는 구조
- 공용 CSS가 특정 페이지의 `page.css`를 import하는 구조
- 데이터 모듈이 DOM이나 UI 모듈에 의존하는 구조
- 서비스가 특정 페이지 URL을 하드코딩하는 구조
- API가 브라우저 DOM이나 페이지 컴포넌트에 의존하는 구조

## 6. 페이지와 URL 정책

- 홈은 `/index.html` 또는 정적 호스트의 `/`로 접근한다.
- 세미나 목록은 `/pages/seminars/`로 접근한다.
- 발표 자료는 `/pages/presentation/horizontal.html?topic=<id>`로 접근한다.
- 읽기 자료는 `/pages/presentation/vertical.html?topic=<id>`로 접근한다.
- 로컬과 배포 환경의 API 상태는 `/api/health`로 확인한다.
- 내부 링크는 현재 페이지 패키지 경로만 사용한다.
- 이전 공개 URL의 호환 요구가 생기면 리다이렉트 파일을 예외로 추가하고 그 이유를 `docs/decisions.md`에 기록한다.

## 7. 확장 절차

### 새 세미나 주제

- `data/topics/<topic-id>.js`에 발표 슬라이드와 읽기 문서 데이터를 추가한다.
- `data/seminars.js`에서 주제를 import하고 database 및 목록에 등록한다.
- 별도 HTML을 만들지 않고 공용 presentation 페이지의 `topic` 쿼리로 접근한다.
- `npm test`와 세미나·가로·세로 화면 브라우저 검증을 수행하고 작업 이력을 기록한다.
- 공통 콘텐츠 계약과 에셋 파이프라인을 구현하기 전에는 현재 데이터 형식을 유지한다. 차기 작성 시스템 설계는 `docs/superpowers/specs/2026-08-03-project-modularization-and-seminar-handoff-design.md`에서 시작한다.

### 새 사용자 화면

- 홈 이외의 화면은 `pages/<page-name>/` 패키지로 만든다.
- 공용 UI와 동작을 먼저 `components/`에서 설계하고 페이지 모듈에는 조립만 둔다.
- 공통 CSS를 우선 확장하고 화면에만 필요한 예외를 `page.css`에 둔다.
- 새 URL과 책임 경계를 현재 문서 및 작업 이력에 반영한다.

### 새 API

- 독립적인 `api/*.mjs` Vercel Function으로 만든다.
- 브라우저 전용 컴포넌트에 의존하지 않게 하고 응답 계약을 자동 테스트한다.
- `npm run dev:vercel`에서 로컬 HTTP 계약을 검증한 뒤 Preview 환경에서 다시 확인한다.

## 8. 변경 검증 기준

프로젝트 변경은 관련 항목을 만족해야 완료된다.

- 구조 검증 스크립트가 모든 필수 파일과 내부 참조를 확인하고 통과한다.
- `fnm use` 후 `node --version`이 `v24`로 시작한다.
- 프로젝트 루트에서 `npm test`가 통과한다.
- 금지된 레거시 경로나 존재하지 않는 내부 파일을 참조하지 않는다.
- 홈 콘텐츠 조각 네 개가 정상적으로 로드된다.
- 세미나 목록이 데이터에서 렌더링된다.
- 모든 PDF 다운로드 버튼에 구분 가능한 접근성 이름이 있다.
- 가로·세로 viewer의 제목, 배지, 모드 전환 링크가 현재 주제를 반영한다.
- 세로 viewer에는 발표용 이전·다음 버튼이 나타나지 않는다.
- 가로 viewer의 키보드 및 버튼 이동이 정상 동작한다.
- PDF용 가로 DOM이 `.slide-container.horizontal` 구조를 가진다.
- PDF 생성 성공과 실패 후 임시 DOM이 남지 않는다.
- 모바일 너비에서 사이트 헤더, 세미나 카드, 프레젠테이션 헤더가 사용할 수 있는 상태다.
- `npm run dev:vercel` 환경에서 `/api/health`가 HTTP 200과 JSON `status: "ok"`를 반환한다.
- 배포 변경은 Vercel Preview에서 정적 페이지와 `/api/health`를 한 번 더 검증한다. Preview 생성에 계정 연결이나 외부 배포 권한이 필요하면 사용자 수행 단계로 명시한다.
- 실제 수행한 검증 명령과 결과가 `docs/history/2026.md`에 기록된다.

## 9. 문서 유지 전략

- `architecture.md`, `conventions.md`, `decisions.md`, `status.md`는 현재 유효한 사실만 유지한다.
- 변경 과정과 대체된 내용은 `history/<year>.md`에 날짜순으로 기록한다.
- 작업마다 별도 로그 파일이나 ADR 파일을 만들지 않는다.
- 여러 세션에 걸쳐 설계할 복잡한 시스템은 구현 전 승인 사양을 `docs/superpowers/specs/`에 둘 수 있다.
- 연도별 이력이 지나치게 커질 때만 분기별 파일로 나누고 `history/<year>.md`를 색인으로 전환한다.
- 동일한 설명을 여러 현재 문서에 복사하지 않고, 한 문서를 기준으로 링크한다.
