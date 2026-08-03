# 일반 모듈화 설계

## 1. 목적

현재 동작과 정적 사이트 구조를 유지하면서 긴 파일, 중복 구현과 흩어진 기능 경계를 책임 중심 모듈로 정리한다. 작업이 끝난 뒤에는 특정 대화나 임시 핸드오프 문서 없이 정규 프로젝트 문서와 모듈 README만으로 현재 상태를 이해할 수 있어야 한다.

## 2. 범위

### 포함

- presentation 컴포넌트의 기능 디렉터리 구성
- PDF 렌더 영역과 내보내기 생명주기 분리
- 중복 HTML 이스케이프 유틸리티 통합
- 프레젠테이션 CSS의 책임별 분리
- 단일 통합 테스트의 도메인별 분리
- 실행 파일 길이 정책의 자동 검증
- 복잡한 기능의 선택적 모듈 README
- 임시 설계·핸드오프 내용을 정규 문서와 이력에 흡수한 뒤 제거

### 제외

- 세미나 콘텐츠 계약, 이미지 에셋 스키마와 작성 도구 구현
- 기존 세미나 데이터 형식 변경
- 새로운 화면, URL, API 또는 사용자 기능 추가
- 번들러, 프레임워크와 프런트엔드 컴파일 도입
- 배포, `main` 보호와 Vercel 프로젝트 설정 변경
- 사용자 소유 변경인 `.gitignore`, `.vscode/`, `.env.local`과 `.vercel/`

## 3. 목표 구조

```text
components/
├── presentation/
│   ├── README.md
│   ├── controller.js
│   ├── document-renderer.js
│   ├── slide-header.js
│   └── slide-renderer.js
├── section-include.js
├── seminar-list.js
└── site-header.js

services/
└── pdf/
    ├── README.md
    ├── exporter.js
    └── render-zone.js

styles/components/presentation/
├── header.css
├── layout.css
├── reading-document.css
└── slide-card.css

tests/
├── README.md
├── helpers/
│   ├── fake-dom.mjs
│   └── files.mjs
├── foundation.test.mjs
├── home.test.mjs
├── pdf.test.mjs
├── presentation.test.mjs
├── seminars.test.mjs
└── structure.test.mjs

utils/
└── html.js
```

단순한 사이트 헤더, 세미나 목록과 비동기 섹션 include는 최상위 컴포넌트에 유지한다. presentation은 네 구현 파일이 같은 생명주기와 렌더링 계약을 공유하므로 기능 디렉터리로 묶는다.

`components/presentation/README.md`는 연결된 `styles/components/presentation/`의 스타일 책임과 import 순서까지 함께 설명한다. 같은 기능을 설명하는 CSS 전용 README는 추가하지 않는다.

## 4. 컴포넌트와 공개 계약

### presentation

- `controller.js`는 기존 `PresentationController`를 같은 계약으로 제공한다.
- `document-renderer.js`는 기존 `renderReadingDocument(container, topicData)`를 유지한다.
- `slide-renderer.js`는 기존 `renderPresentationSlides(container, topicData, options)`를 유지한다.
- `slide-header.js`는 기존 `<slide-header>` 사용자 정의 요소와 `createSlideHeaderMarkup`을 유지한다.
- `README.md`는 모듈 책임, 공개 API, 페이지에서의 사용 순서, 의존 방향, 오류 처리와 테스트 위치를 설명한다.

페이지 모듈은 새 내부 경로를 import하지만 URL, HTML 진입점과 쿼리 계약은 변경하지 않는다. 저장소 밖에서 직접 가져오는 공개 패키지가 아니므로 이전 내부 import 경로를 위한 호환 re-export 파일은 남기지 않는다.

### HTML 안전 유틸리티

`utils/html.js`는 `escapeHtml(value)`와 `escapeAttribute(value)`를 제공한다. 사이트 헤더, 세미나 목록, 슬라이드 헤더와 두 presentation 렌더러는 자체 구현 대신 이 유틸리티를 사용한다. 이스케이프 결과는 현재 코드의 `&`, `<`, `>`, `"` 처리와 호환되어야 한다.

## 5. PDF 서비스

### `render-zone.js`

- PDF용 임시 DOM과 모드별 컨테이너를 구성한다.
- 전달받은 renderer를 호출하고 가로 카드의 page-break 속성을 설정한다.
- 브라우저 layout 대기를 제공한다.
- PDF 엔진, 다운로드 파일명, fallback URL과 페이지 상태를 알지 않는다.

### `exporter.js`

- 렌더 영역 생성부터 제거까지 전체 생명주기를 소유한다.
- PDF 옵션과 파일명을 구성하고 사용 가능한 엔진을 호출한다.
- 엔진이 없을 때 전달받은 fallback을 호출한다.
- 성공, 엔진 오류와 fallback 오류를 포함한 모든 경로에서 `finally`로 임시 DOM을 제거한다.

기존 `exportSeminarPdf`, `createPdfOptions`, `createPdfRenderZone`의 관찰 가능한 계약은 유지하되 import 위치만 새 모듈 경계에 맞게 변경한다.

## 6. CSS 분리

기존 `styles/components/presentation.css`는 다음 책임으로 나눈다.

- `header.css`: 고정 헤더, 제목, 배지, 액션과 이전·다음 버튼
- `layout.css`: viewer wrapper, 가로 스크롤 컨테이너와 공통 콘텐츠 내부 배치
- `slide-card.css`: cover, header, body, split grid, code block와 footer
- `reading-document.css`: 읽기 문서 header, section, callout와 읽기용 code 보정

각 파일은 자신이 소유한 모바일 media query도 함께 가진다. `styles/main.css`는 위 순서대로 import해 기존 cascade를 유지한다. 선택자 이름, 디자인 토큰과 시각 결과는 변경하지 않는다.

## 7. 테스트 구조

- `foundation.test.mjs`: 필수 개발 파일, Node/Vercel 메타데이터와 health function
- `home.test.mjs`: 공통 홈 기반과 사이트 헤더
- `seminars.test.mjs`: 세미나 페이지, 목록 접근성과 다운로드 상태
- `presentation.test.mjs`: mode·topic 해석, 렌더러, 헤더와 controller
- `pdf.test.mjs`: render zone, 옵션, 성공·실패 정리와 fallback
- `structure.test.mjs`: 레거시 부재, 로컬 참조, 모듈 문서와 파일 길이 정책
- `helpers/fake-dom.mjs`: 테스트용 DOM·element 생성기
- `helpers/files.mjs`: 파일 수집과 로컬 참조 확인

`package.json#scripts.test`는 `tests/*.test.mjs`만 실행해 helper를 독립 테스트로 인식하지 않는다. 기존 테스트의 행위 계약은 도메인 파일로 그대로 이동하고, 새 구조와 공통 유틸리티 계약을 먼저 실패하는 테스트로 추가한다.

## 8. 파일 길이 정책

자동 검사는 다음 경로의 `.js`, `.mjs`, `.css` 파일을 대상으로 한다.

- `api/`
- `components/`
- `pages/`
- `services/`
- `styles/`
- `tests/`
- `utils/`

`data/`, `content/`, `docs/`, lockfile과 외부 의존성은 제외한다.

- 200줄 이하는 기본 허용한다.
- 201~300줄은 `structure.test.mjs`의 예외 목록에 파일 경로와 구체적인 책임 유지 사유가 있을 때만 허용한다.
- 300줄 초과는 예외 없이 실패한다.
- 이번 모듈화가 끝나는 시점에는 예외 목록을 비워 두는 것을 목표로 한다.

줄 수는 책임 경계를 검토하게 하는 보조 가드다. 짧은 파일을 만들기 위해 응집된 동작을 인위적으로 나누지 않는다.

## 9. 데이터 흐름과 오류 처리

허용하는 흐름은 다음과 같다.

```text
page → presentation/seminar component → data
page → PDF exporter → render zone
component → HTML utility
```

- 데이터 모듈은 UI와 유틸리티에 의존하지 않는다.
- renderer는 컨테이너나 필요한 데이터가 없을 때 기존처럼 안전하게 반환한다.
- 알 수 없는 topic은 현재 기본 topic fallback을 유지한다.
- PDF 엔진 부재는 현재 인쇄 fallback을 유지한다.
- 오류가 발생해도 PDF 임시 DOM과 다운로드 버튼 상태가 남지 않아야 한다.
- 모듈 이동 과정에서 오류를 숨기는 새로운 catch나 무음 fallback을 추가하지 않는다.

## 10. 문서와 인수인계

영구 인수인계는 다음 정규 문서가 담당한다.

- `README.md`: 실행 방법과 문서 색인
- `AGENTS.md`: 작업 수행 규칙
- `docs/architecture.md`: 현재 구조와 의존 방향
- `docs/conventions.md`: 구현과 문서 유지 규칙
- `docs/decisions.md`: 장기 결정
- `docs/status.md`: 현재 문제, 열린 결정과 다음 작업
- `docs/history/YYYY.md`: 완료된 작업, 문제 해결과 검증 근거
- 모듈 README: 해당 모듈의 보편적인 공개 계약

구현 완료 후 이 설계 문서, 기존 `2026-08-03-project-modularization-and-seminar-handoff-design.md`와 이 설계에서 파생된 구현 계획의 보편적인 내용은 정규 문서에 흡수한다. 세미나 작성 시스템의 확정 목표와 열린 결정은 `docs/status.md`에 남긴다. 완료된 임시 사양·계획과 비어 있는 `docs/superpowers/` 하위 디렉터리는 제거하고 README의 임시 핸드오프 링크도 삭제한다.

향후에도 설계 사양은 작업 중 사용할 수 있지만 완료 조건에 다음을 포함한다.

1. 현재 유효한 내용은 정규 문서 또는 모듈 README에 흡수한다.
2. 해결 과정은 연도별 이력에 보존한다.
3. 현재 상태를 설명하는 데 필요하지 않은 임시 설계와 핸드오프는 제거한다.

## 11. 검증

구조 변경은 다음 순서로 검증한다.

1. 새 구조와 파일 길이 정책의 실패 테스트를 확인한다.
2. 도메인별 테스트 이동 후 전체 자동 테스트를 실행한다.
3. 존재하지 않는 import, HTML/CSS 로컬 참조와 구 경로가 없는지 검사한다.
4. PDF 성공, 실패와 엔진 부재 후 임시 DOM 정리를 확인한다.
5. 로컬 서버에서 홈, 세미나와 두 주제의 가로·세로 화면을 데스크톱과 390×844 모바일 뷰포트로 확인한다.
6. 헤더, 카드, 슬라이드, 읽기 문서, 키보드 이동, topic 유지 링크와 가로 overflow를 회귀 검증한다.
7. `git diff --check`와 최종 파일 길이 검사를 실행한다.

Vercel Function과 라우팅은 변경하지 않으므로 `npm run dev:vercel` 통합 검증은 필수가 아니다. 정적 서버에서 화면 검증을 수행하고 기존 `/api/health` 계약은 자동 테스트로 유지한다.

## 12. 완료 기준

- 목표 구조의 presentation, PDF, CSS와 테스트 모듈이 구성된다.
- 실행 코드, CSS와 테스트에 200줄 초과 예외가 없고 300줄 초과 파일이 없다.
- 중복 HTML 이스케이프 구현이 제거된다.
- 기존 URL, topic fallback, 키보드 이동, PDF와 인쇄 fallback이 유지된다.
- 자동 테스트와 데스크톱·모바일 회귀 검증이 통과한다.
- 정규 문서와 세 모듈 README만으로 현재 구조와 다음 작업을 이해할 수 있다.
- 임시 설계·핸드오프 문서와 README의 임시 링크가 제거된다.
- 세미나 작성 시스템만 다음 별도 설계 작업으로 남는다.
