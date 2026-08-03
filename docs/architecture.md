# Portfolio Architecture

> 상태: 승인된 목표 구조. 구조 개편 작업이 완료되면 이 문서에서 이 안내를 제거하고 현재 구조의 기준 문서로 사용한다.

## 1. 목적

이 프로젝트는 별도의 빌드 도구 없이 배포할 수 있는 순수 정적 사이트를 유지한다. `index.html`을 제외한 모든 화면은 `pages/` 아래에서 명시적인 페이지 패키지를 가지며, 실제 구현은 재사용 가능한 컴포넌트를 중심으로 구성한다.

구조가 확장되더라도 다음 질문에 빠르게 답할 수 있어야 한다.

- URL로 직접 열리는 화면은 어디에 있는가?
- 특정 UI와 동작을 담당하는 컴포넌트는 어디에 있는가?
- 여러 페이지가 공유하는 스타일은 어디에 있는가?
- 현재 문제와 다음 작업은 무엇인가?
- 구조와 규칙이 왜 이렇게 결정되었는가?
- 과거 작업에서 무엇을 발견하고 변경했는가?

## 2. 필수 원칙

### 2.1 정적 사이트 유지

- 런타임과 배포에 번들러, 프레임워크 또는 서버 라우팅을 요구하지 않는다.
- 페이지는 표준 HTML, CSS, JavaScript ES module만으로 실행한다.
- 모든 경로는 정적 파일 서버에서 직접 해석할 수 있어야 한다.

### 2.2 페이지 패키지와 컴포넌트 중심 구현

- 루트 `index.html`은 프로젝트의 유일한 예외 진입 페이지다.
- 그 외 URL 진입 화면은 `pages/<page-name>/` 아래에 둔다.
- 각 페이지 패키지는 HTML, 초기화 JavaScript, 페이지 전용 CSS를 함께 가진다.
- 페이지 모듈은 조립과 초기화만 담당한다.
- 재사용 가능한 마크업, 상태, 이벤트 동작은 `components/`에 둔다.
- PDF 생성처럼 UI가 아닌 기능은 `services/`에 둔다.
- 화면과 독립적인 콘텐츠 데이터는 `data/`에 둔다.

### 2.3 공통 CSS 우선

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

### 2.4 모든 작업에 문서화 동반

프로젝트 파일을 변경하는 모든 작업은 같은 작업 범위 안에서 관련 문서와 작업 이력을 함께 갱신해야 한다. 문서화가 끝나지 않은 작업은 완료로 간주하지 않는다.

최소 요구사항은 다음과 같다.

1. `docs/history/<year>.md`에 요청, 문제, 결정, 수행 내용, 검증 결과, 남은 작업을 기록한다.
2. 구조가 변하면 `docs/architecture.md`를 갱신한다.
3. 구현 규칙이 변하면 `docs/conventions.md`를 갱신한다.
4. 장기적으로 영향을 주는 결정이 변하면 `docs/decisions.md`를 갱신한다.
5. 현재 문제, 다음 작업 또는 완료 상태가 변하면 `docs/status.md`를 갱신한다.
6. 실행한 자동 테스트와 브라우저 검증 결과를 작업 이력에 남긴다.

단순한 읽기, 설명 또는 프로젝트 파일을 변경하지 않는 검토는 새 이력을 강제하지 않는다. 다만 검토 결과를 프로젝트 피드백으로 보존해 달라는 요청이 있으면 반드시 기록한다.

## 3. 목표 디렉터리 구조

```text
portfolio/
├── index.html
├── AGENTS.md
├── README.md
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
│   └── history/
│       └── 2026.md
│
└── tests/
    └── verify_structure.py
```

## 4. 영역별 책임

### `pages/`

URL로 직접 열리는 화면을 소유한다. 각 페이지의 HTML은 콘텐츠가 들어갈 마운트 지점과 페이지 진입 모듈만 선언한다. `page.js`는 데이터 선택, 컴포넌트 조립, 페이지 생명주기 시작을 담당하며 재사용 가능한 렌더링 로직을 직접 구현하지 않는다.

### `components/`

독립적인 UI 또는 사용자 상호작용 단위를 소유한다. 각 컴포넌트는 입력, 출력, 의존성을 코드만 읽지 않아도 설명할 수 있어야 한다. 특정 페이지 URL이나 페이지 전용 CSS에 의존하지 않는다.

### `services/`

PDF 내보내기처럼 UI 표현과 분리할 수 있는 기능을 소유한다. 임시 리소스를 생성하는 서비스는 성공과 실패 여부에 관계없이 정리 책임까지 가진다.

### `data/`

세미나 목록과 주제 콘텐츠를 소유한다. 페이지, 컴포넌트, 서비스 또는 DOM에 의존하지 않는다. 세미나 콘텐츠의 단일 출처다.

### `content/`

데이터 객체로 표현하지 않는 정적 HTML 콘텐츠를 소유한다. 홈 화면의 비동기 섹션 조각은 `content/home/`에 둔다.

### `styles/`

프로젝트 전체의 시각 언어와 공통 표현을 소유한다. 토큰, 기본 요소, 공통 레이아웃, 컴포넌트 스타일 순으로 의존한다. 페이지별 예외는 각 페이지 패키지의 `page.css`에 둔다.

### `docs/`

현재 구조, 현재 규칙, 현재 상태, 현재 결정과 압축된 변경 이력을 소유한다. 현재 문서에는 과거 설명을 누적하지 않고, 과거 내용은 연도별 이력에 보존한다.

## 5. 의존 방향

허용되는 기본 의존 방향은 다음과 같다.

```text
page → component → service/data
page.css → shared styles
component → component
service → data 또는 전달받은 DOM 렌더러
```

다음 역방향 의존은 금지한다.

- 공용 컴포넌트가 특정 페이지 모듈을 import하는 구조
- 공용 CSS가 특정 페이지의 `page.css`를 import하는 구조
- 데이터 모듈이 DOM이나 UI 모듈에 의존하는 구조
- 서비스가 특정 페이지 URL을 하드코딩하는 구조

## 6. 페이지와 URL 정책

- 홈은 `/index.html` 또는 정적 호스트의 `/`로 접근한다.
- 세미나 목록은 `/pages/seminars/`로 접근한다.
- 발표 자료는 `/pages/presentation/horizontal.html?topic=<id>`로 접근한다.
- 읽기 자료는 `/pages/presentation/vertical.html?topic=<id>`로 접근한다.
- 내부 링크는 모두 새 경로로 갱신한다.
- 외부에 공개된 기존 URL이 있다는 근거가 없으므로 주제별 리다이렉트 HTML과 루트 `seminar.html`은 유지하지 않는다.
- 향후 공개 URL 호환 요구가 생기면 리다이렉트 파일을 예외로 추가하고 그 이유를 `docs/decisions.md`에 기록한다.

## 7. 초기 구조 개편 범위

구조 개편 시 다음 작업을 함께 수행한다.

- `level1-*`, `level2-*`, `level3-*`, `level4-*` 디렉터리를 책임 기반 이름으로 대체한다.
- 세미나와 프레젠테이션 HTML 및 초기화 코드를 페이지 패키지로 이동한다.
- 홈 섹션 조각을 `content/home/`으로 이동한다.
- PDF 생성을 `services/pdf-exporter.js`로 분리한다.
- 사용되지 않는 `components/slide-controller.js`를 제거한다.
- 데이터와 중복되는 `sections/seminar-list.html`을 제거한다.
- 주제별 리다이렉트 HTML 네 개를 제거한다.
- 슬라이드 헤더가 동적으로 설정된 속성을 반영하도록 수정한다.
- PDF용 가로 슬라이드 DOM을 실제 viewer와 같은 구조로 생성한다.
- PDF 실패 시 임시 DOM을 항상 제거한다.
- 다운로드 버튼에 주제와 형식을 포함한 접근성 이름을 제공한다.
- HTML에서 그대로 노출되는 Markdown 강조 문법을 시맨틱 HTML로 교체한다.
- 오래된 PowerShell 검증기를 Python 표준 라이브러리만 사용하는 `tests/verify_structure.py`로 교체한다.
- `README.md`, 현재 문서와 연도별 작업 이력을 함께 갱신한다.

## 8. 검증 기준

구조 개편은 다음 조건을 모두 만족해야 완료된다.

- 구조 검증 스크립트가 모든 필수 파일과 내부 참조를 확인하고 통과한다.
- 삭제된 구경로를 참조하는 HTML, JavaScript, CSS가 없다.
- 홈 콘텐츠 조각 네 개가 정상적으로 로드된다.
- 세미나 목록이 데이터에서 렌더링된다.
- 모든 PDF 다운로드 버튼에 구분 가능한 접근성 이름이 있다.
- 가로·세로 viewer의 제목, 배지, 모드 전환 링크가 현재 주제를 반영한다.
- 세로 viewer에는 발표용 이전·다음 버튼이 나타나지 않는다.
- 가로 viewer의 키보드 및 버튼 이동이 정상 동작한다.
- PDF용 가로 DOM이 `.slide-container.horizontal` 구조를 가진다.
- PDF 생성 성공과 실패 후 임시 DOM이 남지 않는다.
- 모바일 너비에서 사이트 헤더, 세미나 카드, 프레젠테이션 헤더가 사용할 수 있는 상태다.
- 실제 수행한 검증 명령과 결과가 `docs/history/2026.md`에 기록된다.

## 9. 문서 유지 전략

- `architecture.md`, `conventions.md`, `decisions.md`, `status.md`는 현재 유효한 사실만 유지한다.
- 변경 과정과 대체된 내용은 `history/<year>.md`에 날짜순으로 기록한다.
- 작업마다 별도 로그 파일이나 ADR 파일을 만들지 않는다.
- 연도별 이력이 지나치게 커질 때만 분기별 파일로 나누고 `history/<year>.md`를 색인으로 전환한다.
- 동일한 설명을 여러 현재 문서에 복사하지 않고, 한 문서를 기준으로 링크한다.
