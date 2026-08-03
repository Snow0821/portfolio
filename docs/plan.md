# Page Package Architecture Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 순수 정적 사이트를 페이지 패키지와 공용 컴포넌트 중심 구조로 개편하고, 공통 CSS 계층·동작 문제 수정·상시 문서화 규칙을 함께 적용한다.

**Architecture:** 루트 `index.html` 외의 URL 진입점은 `pages/` 아래에 둔다. 페이지 모듈은 데이터 선택과 컴포넌트 조립만 담당하고, 재사용 UI는 `components/`, PDF 내보내기는 `services/`, 정적 홈 콘텐츠는 `content/`가 담당한다. 모든 변경 작업은 현재 문서와 `docs/history/2026.md`를 같은 커밋에서 갱신한다.

**Tech Stack:** HTML5, CSS, JavaScript ES modules, Web Components, Python 3 표준 라이브러리, 브라우저 기반 수동 검증

## Global Constraints

- 빌드 도구, JavaScript 패키지 관리자, 프레임워크를 추가하지 않는다.
- 루트 `index.html`을 제외한 모든 URL 진입 화면은 `pages/` 아래에 둔다.
- CSS 의존 순서는 `tokens → base → layouts → components → page.css`를 유지한다.
- `data/`는 DOM, 컴포넌트, 페이지, 서비스에 의존하지 않는다.
- 서비스는 특정 페이지 URL을 하드코딩하지 않는다.
- 프로젝트 파일을 변경한 모든 작업은 같은 작업 안에서 관련 현재 문서와 `docs/history/2026.md`를 갱신한다.
- 문서화와 검증 결과 기록이 끝나지 않은 작업은 완료로 간주하지 않는다.
- 기존 사용자 변경을 보존하고 각 커밋에는 해당 작업 범위의 파일만 포함한다.

---

## Target File Map

### 생성

- `AGENTS.md`: 작업자가 반드시 따라야 할 문서화·구조·검증 규칙
- `README.md`: 실행 방법, URL, 새 세미나 추가법, 문서 색인
- `pages/seminars/index.html`: 세미나 목록 진입 HTML
- `pages/seminars/page.js`: 세미나 데이터와 목록/PDF 기능 조립
- `pages/seminars/page.css`: 세미나 페이지의 헤더 배치만 소유
- `pages/presentation/horizontal.html`: 가로 프레젠테이션 진입 HTML
- `pages/presentation/vertical.html`: 세로 읽기 문서 진입 HTML
- `pages/presentation/page.js`: `body[data-presentation-mode]`에 따라 공용 초기화
- `pages/presentation/page.css`: 프레젠테이션 페이지 셸의 화면별 예외
- `components/site-header.js`: 홈과 세미나 페이지가 공유하는 사이트 내비게이션
- `components/seminar-list.js`: 세미나 카드 렌더링과 PDF 요청 이벤트 연결
- `components/document-renderer.js`: 세로 문서 렌더링
- `components/slide-renderer.js`: 가로 슬라이드 렌더링
- `components/presentation-controller.js`: 가로 슬라이드 이동과 상태 갱신
- `services/pdf-exporter.js`: PDF용 DOM 생성, 내보내기, 실패 처리와 정리
- `content/home/*.html`: 홈 정적 콘텐츠 네 개
- `styles/main.css`: 공통 CSS 진입점
- `styles/base.css`: 전역 기본 표현
- `styles/layouts.css`: 공통 컨테이너와 홈 레이아웃
- `styles/components/site-header.css`: 공용 사이트 헤더
- `styles/components/content-section.css`: 홈 콘텐츠 섹션과 인트로
- `styles/components/seminar-card.css`: 세미나 카드와 액션
- `styles/components/presentation.css`: 프레젠테이션 헤더, 레이아웃, 카드
- `docs/conventions.md`: 구현 및 문서화 규칙
- `docs/decisions.md`: 현재 유효한 구조 결정
- `tests/verify_structure.py`: Python 표준 라이브러리 기반 구조 검증

### 수정

- `index.html`: 사이트 헤더 컴포넌트, 새 홈 콘텐츠와 CSS 경로 사용
- `styles/components/entry.css`: 홈 엔트리 스타일 유지 및 새 공통 구조와 호환
- `styles/print.css`: 새 헤더 요소와 페이지 경로에 맞춘 인쇄 규칙
- `docs/architecture.md`: 목표 상태 안내 제거 및 실제 구조 반영
- `docs/status.md`: 진행/문제/완료 상태 갱신
- `docs/history/2026.md`: 각 작업의 결정·수행·검증 결과 기록

### 제거

- `seminar.html`
- `sections/`
- `slides/`
- `components/level3-seminar-page/`
- `components/level4-presentation/`
- `components/slide-controller.js`
- `styles/style.css`
- `styles/level1-main/`
- `styles/level2-navigation/`
- `styles/level3-seminar-page/`
- `styles/level4-presentation/`
- `tests/verify-structure.ps1`
- `log/`

---

### Task 1: Documentation Guardrails

**Files:**
- Create: `AGENTS.md`
- Replace: `README.md`
- Create: `docs/conventions.md`
- Create: `docs/decisions.md`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`
- Test: `tests/verify_structure.py`

**Interfaces:**
- Consumes: 문서화 필수 원칙과 목표 구조가 정의된 `docs/architecture.md`
- Produces: 모든 후속 작업이 따를 루트 규칙, 현재 규칙, 현재 결정, 문서 색인

- [ ] **Step 1: Write the documentation structure test**

`tests/verify_structure.py`를 만들고 다음 검사를 구현한다.

```python
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def require_files(paths: list[str]) -> list[str]:
    return [path for path in paths if not (ROOT / path).is_file()]


def require_text(path: str, snippets: list[str]) -> list[str]:
    content = (ROOT / path).read_text(encoding="utf-8")
    return [f"{path}: {snippet}" for snippet in snippets if snippet not in content]


errors = []
errors.extend(
    f"Missing required file: {path}"
    for path in require_files(
        [
            "AGENTS.md",
            "README.md",
            "docs/architecture.md",
            "docs/conventions.md",
            "docs/decisions.md",
            "docs/status.md",
            "docs/history/2026.md",
        ]
    )
)

if (ROOT / "AGENTS.md").is_file():
    errors.extend(
        f"Missing required text: {item}"
        for item in require_text(
            "AGENTS.md",
            [
                "문서화가 끝나지 않은 작업은 완료로 간주하지 않는다",
                "docs/history/<year>.md",
                "docs/status.md",
            ],
        )
    )

if errors:
    print("\n".join(errors), file=sys.stderr)
    raise SystemExit(1)

print("Structure verification passed.")
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `python3 tests/verify_structure.py`

Expected: FAIL because `AGENTS.md`, `docs/conventions.md`, and `docs/decisions.md` do not exist.

- [ ] **Step 3: Write the root rules and current documentation**

`AGENTS.md`에는 다음 규칙을 명령형으로 작성한다.

```markdown
# Project Working Rules

## Required documentation

- 프로젝트 파일을 변경한 모든 작업은 같은 작업 안에서 관련 문서와 `docs/history/<year>.md`를 갱신한다.
- 구조 변경은 `docs/architecture.md`, 규칙 변경은 `docs/conventions.md`, 장기 결정 변경은 `docs/decisions.md`, 현재 상태 변경은 `docs/status.md`에 반영한다.
- 실행한 자동 테스트와 브라우저 검증 결과를 작업 이력에 기록한다.
- 문서화가 끝나지 않은 작업은 완료로 간주하지 않는다.

## Architecture

- 루트 `index.html` 외의 화면은 `pages/` 아래에 둔다.
- 페이지는 조립만 담당하고 재사용 UI는 `components/`, 비-UI 기능은 `services/`, 콘텐츠 데이터는 `data/`에 둔다.
- 공통 CSS를 우선하고 페이지 CSS에는 해당 화면만의 예외를 둔다.

## Verification

- 완료를 보고하기 전에 `python3 tests/verify_structure.py`를 실행한다.
- 사용자 동작이나 레이아웃을 변경한 경우 로컬 정적 서버에서 관련 화면을 브라우저로 확인한다.
```

`docs/conventions.md`에는 페이지 패키지, 컴포넌트 승격, CSS 계층, import 방향, 접근성, 테스트, 문서 갱신 형식을 기록한다. `docs/decisions.md`에는 `D-001 페이지 패키지`, `D-002 공통 CSS 계층`, `D-003 현재 문서와 연도별 이력`, `D-004 Python 구조 검증기`를 상태 `적용`으로 기록한다. `README.md`에는 프로젝트 개요, `python3 -m http.server 4173` 실행법, 현재와 목표 URL, 문서 링크를 작성한다.

- [ ] **Step 4: Update current status and history**

`docs/history/2026.md`의 이번 구조 개편 기록 아래에 `문서 가드레일 적용` 하위 항목을 추가하고 생성한 문서, 검증 명령과 결과를 기록한다. `docs/status.md`의 진행 중 항목을 `문서 가드레일 적용 완료, 공통 기반 이전 대기`로 갱신한다.

- [ ] **Step 5: Run the test and verify it passes**

Run: `python3 tests/verify_structure.py`

Expected: `Structure verification passed.`

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md README.md docs tests/verify_structure.py
git commit -m "docs: establish project working rules"
```

---

### Task 2: Shared Styles, Site Header, and Home Content

**Files:**
- Create: `components/site-header.js`
- Create: `content/home/about.html`
- Create: `content/home/research.html`
- Create: `content/home/career.html`
- Create: `content/home/academic.html`
- Create: `styles/main.css`
- Create: `styles/base.css`
- Create: `styles/layouts.css`
- Create: `styles/components/site-header.css`
- Create: `styles/components/content-section.css`
- Modify: `styles/components/entry.css`
- Modify: `styles/print.css`
- Modify: `components/section-include.js`
- Modify: `index.html`
- Modify: `tests/verify_structure.py`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`

**Interfaces:**
- Consumes: `<site-header home-href seminars-href current>` attributes and `<section-include src>`
- Produces: `site-header` custom element and shared `styles/main.css` entry point used by every page

- [ ] **Step 1: Extend the structure test for the shared foundation**

필수 파일 목록에 새 컴포넌트, `content/home/*.html`, `styles/main.css`, `styles/base.css`, `styles/layouts.css`, 공통 컴포넌트 CSS를 추가한다. `index.html`에서 `./styles/main.css`, `./components/site-header.js`, `./content/home/about.html`, `./pages/seminars/`를 요구한다.

- [ ] **Step 2: Run the test and verify it fails**

Run: `python3 tests/verify_structure.py`

Expected: FAIL with missing shared foundation paths.

- [ ] **Step 3: Implement the site header component**

`components/site-header.js`에 `home-href`, `seminars-href`, `current`를 `observedAttributes`로 선언하고 연결 또는 속성 변경 시 다시 렌더링하는 `SiteHeader`를 구현한다. 출력은 브랜드 링크와 `aria-label="주요 메뉴"` 내비게이션이며 현재 링크에만 `aria-current="page"`를 설정한다.

- [ ] **Step 4: Consolidate shared CSS**

기존 CSS를 다음처럼 이동·병합한다.

- `level1-main/base.css` → `styles/base.css`
- `level1-main/layout.css`와 홈 인트로 배치 → `styles/layouts.css`
- `level2-navigation/site-header.css` → `styles/components/site-header.css`
- `styles/components/intro.css`와 `styles/components/section.css` → `styles/components/content-section.css`
- `styles/components/entry.css`는 같은 경로에서 유지
- `styles/main.css`는 `tokens.css`, `base.css`, `layouts.css`, 공통 컴포넌트 CSS, `print.css` 순으로 import

- [ ] **Step 5: Move home content and update the home page**

네 개의 `sections/*.html` 내용을 `content/home/*.html`로 옮긴다. `index.html`은 `<site-header>`를 사용하고 새 콘텐츠 경로 및 `styles/main.css`를 참조한다. `section-include.js`의 동작은 유지하되 기존 사용자 변경을 보존한다.

- [ ] **Step 6: Document and verify the task**

Run: `python3 tests/verify_structure.py`

Run: `python3 -m http.server 4173`

브라우저에서 `/`를 열어 네 콘텐츠 섹션, 현재 내비게이션, 콘솔 오류 부재를 확인한다. 결과를 `docs/history/2026.md`에 기록하고 `docs/status.md`를 `공통 기반 및 홈 이전 완료`로 갱신한다.

- [ ] **Step 7: Commit**

```bash
git add index.html components content styles tests docs
git commit -m "refactor: establish shared site foundation"
```

---

### Task 3: Seminar Page Package and Accessible List Component

**Files:**
- Create: `pages/seminars/index.html`
- Create: `pages/seminars/page.js`
- Create: `pages/seminars/page.css`
- Create: `components/seminar-list.js`
- Create: `styles/components/seminar-card.css`
- Modify: `styles/main.css`
- Modify: `index.html`
- Modify: `tests/verify_structure.py`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`

**Interfaces:**
- Consumes: `seminarList` and an injected download callback; Task 5 replaces the temporary callback with the PDF service
- Produces: `renderSeminarList(container, { seminars, paths, onDownload })`

- [ ] **Step 1: Extend the test for the seminar page contract**

필수 파일에 세미나 페이지 패키지, `components/seminar-list.js`, `styles/components/seminar-card.css`를 추가한다. `pages/seminars/index.html`에서 `../../styles/main.css`, `./page.css`, `./page.js`를 요구하고, `components/seminar-list.js`에서 `aria-label`과 전달받은 `onDownload` 사용을 요구한다.

- [ ] **Step 2: Run the test and verify it fails**

Run: `python3 tests/verify_structure.py`

Expected: FAIL with missing seminar page package.

- [ ] **Step 3: Implement the seminar list component**

다음 인터페이스를 구현한다.

```js
export function renderSeminarList(container, { seminars, paths, onDownload })
```

`paths.vertical(topicId)`와 `paths.horizontal(topicId)`로 링크를 만들고, 각 다운로드 버튼에는 `${item.title} 읽기용 문서 PDF 다운로드` 또는 `${item.title} 발표용 슬라이드 PDF 다운로드`를 `aria-label`로 설정한다. 클릭 시 `onDownload({ topicId, mode, button })`을 호출한다.

- [ ] **Step 4: Build the seminar page package**

`index.html`은 `<site-header>`와 `#seminar-list-container`만 선언하고 Markdown 별표 대신 `<strong>`을 사용한다. `page.js`는 데이터를 읽고 `renderSeminarList`에 새 presentation URL 생성 함수와 PDF callback을 주입한다. Task 5 전까지 PDF callback은 사용자에게 읽기/발표 페이지의 인쇄 기능을 사용하라는 명시적 오류 메시지를 제공하며, Task 5에서 exporter 호출로 교체한다.

- [ ] **Step 5: Split page and component styles**

세미나 소개 헤더 배치만 `pages/seminars/page.css`로 이동한다. 카드, 태그, 버튼, 반응형 액션 스타일은 `styles/components/seminar-card.css`로 이동하고 `styles/main.css`에서 import한다.

- [ ] **Step 6: Document and verify the task**

Run: `python3 tests/verify_structure.py`

브라우저에서 `/pages/seminars/`를 열어 카드 두 개, 네 개의 구분 가능한 다운로드 버튼 이름, 새 presentation 링크, Markdown 별표 부재, 모바일 너비의 액션 배치를 확인한다. 결과를 `docs/history/2026.md`와 `docs/status.md`에 반영한다.

- [ ] **Step 7: Commit**

```bash
git add index.html pages/seminars components/seminar-list.js styles tests docs
git commit -m "refactor: create seminar page package"
```

---

### Task 4: Presentation Page Package and Reactive Header

**Files:**
- Create: `pages/presentation/horizontal.html`
- Create: `pages/presentation/vertical.html`
- Create: `pages/presentation/page.js`
- Create: `pages/presentation/page.css`
- Modify: `components/slide-header.js`
- Create: `components/document-renderer.js`
- Create: `components/slide-renderer.js`
- Create: `components/presentation-controller.js`
- Create: `styles/components/presentation.css`
- Modify: `styles/main.css`
- Modify: `styles/print.css`
- Modify: `tests/verify_structure.py`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`

**Interfaces:**
- Consumes: `seminarsDatabase[topicId]`, `<body data-presentation-mode="horizontal|vertical">`
- Produces: `renderReadingDocument(container, topicData)`, `renderPresentationSlides(container, topicData)`, `PresentationController`, reactive `slide-header`

- [ ] **Step 1: Extend the test for presentation contracts**

필수 파일과 각 HTML의 `data-presentation-mode`, `../../styles/main.css`, `./page.css`, `./page.js` 참조를 검사한다. `slide-header.js`가 `observedAttributes`와 `attributeChangedCallback`을 포함하는지 검사한다.

- [ ] **Step 2: Run the test and verify it fails**

Run: `python3 tests/verify_structure.py`

Expected: FAIL with missing presentation package and reactive header contract.

- [ ] **Step 3: Make the slide header reactive**

`title`, `badge`, `badge-class`, `alt-href`, `alt-text`, `is-presentation`을 `observedAttributes`로 선언한다. `connectedCallback()`과 값이 실제로 바뀐 `attributeChangedCallback()`이 동일한 `render()`를 호출하게 한다. 읽기 모드에서는 counter와 navigation button을 렌더링하지 않는다.

- [ ] **Step 4: Move presentation renderers and controller**

기존 `level4-presentation` 구현을 최상위 컴포넌트 파일로 옮기고 import 경로만 새 구조에 맞춘다. 렌더링 결과와 키보드·버튼 내비게이션 동작은 유지한다. 사용하지 않는 별도 `slide-controller.js`의 코드는 복제하지 않는다.

- [ ] **Step 5: Build the shared presentation page initializer**

`page.js`는 `document.body.dataset.presentationMode`를 읽는다. 잘못된 topic은 `python-intro`로 대체하고 전환 링크에는 요청 문자열이 아니라 실제 `topicData.id`를 사용한다. horizontal은 slide renderer와 controller를 시작하고 vertical은 document renderer만 시작한다. `?print=true`이면 렌더링 후 `window.print()`를 호출한다.

- [ ] **Step 6: Consolidate presentation CSS**

기존 presentation header/layout/cards CSS를 `styles/components/presentation.css`로 병합한다. 프레젠테이션 페이지 셸의 모드별 예외만 `pages/presentation/page.css`에 둔다. 인쇄 규칙은 `styles/print.css`로 병합한다.

- [ ] **Step 7: Document and verify the task**

Run: `python3 tests/verify_structure.py`

브라우저에서 두 topic의 horizontal/vertical URL을 확인한다. 제목, 배지, 실제 topic을 유지하는 모드 전환 링크, horizontal의 `1 / 5`, vertical의 navigation button 부재, 화살표와 Space 이동을 검증한다. 결과를 현재 문서와 이력에 기록한다.

- [ ] **Step 8: Commit**

```bash
git add pages/presentation components styles tests docs
git commit -m "refactor: create presentation page package"
```

---

### Task 5: PDF Export Service and Cleanup Guarantees

**Files:**
- Create: `services/pdf-exporter.js`
- Modify: `pages/seminars/page.js`
- Modify: `components/seminar-list.js`
- Modify: `pages/seminars/index.html`
- Modify: `tests/verify_structure.py`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`

**Interfaces:**
- Consumes: `{ topicData, mode, renderContent, html2pdf, onFallback }`
- Produces: `createPdfRenderZone({ topicData, mode, renderContent })`, `exportSeminarPdf(options)`

- [ ] **Step 1: Extend the test for the PDF service boundary**

`services/pdf-exporter.js`를 필수 파일로 추가하고 `finally`, `.slide-container`, `renderContent`, `onFallback` 문자열을 요구한다. `pages/seminars/page.js`에서 `exportSeminarPdf`, `renderReadingDocument`, `renderPresentationSlides` import를 요구한다.

- [ ] **Step 2: Run the test and verify it fails**

Run: `python3 tests/verify_structure.py`

Expected: FAIL because the PDF service does not exist.

- [ ] **Step 3: Implement the render-zone factory**

다음 인터페이스를 구현한다.

```js
export function createPdfRenderZone({ topicData, mode, renderContent })
```

vertical은 wrapper 안에 document target을 만들고, horizontal은 wrapper 안에 실제 `.slide-container.horizontal` target을 만든다. `renderContent(target, topicData)`를 호출한 뒤 horizontal 카드에 A4 landscape용 높이와 page break를 설정해 wrapper를 반환한다.

- [ ] **Step 4: Implement export with guaranteed cleanup**

다음 인터페이스를 구현한다.

```js
export async function exportSeminarPdf({
  topicData,
  mode,
  renderContent,
  html2pdf = window.html2pdf,
  onFallback,
})
```

렌더 영역을 body에 추가하고, exporter가 없으면 `onFallback()`을 호출한다. exporter가 있으면 기존 A4 설정을 사용해 저장한다. 성공, fallback, throw 모든 경로에서 `finally`가 render zone을 제거한다. 서비스는 viewer URL을 알지 못한다.

- [ ] **Step 5: Wire the service into the seminar page**

`page.js`가 mode에 따라 renderer를 선택해 exporter에 전달한다. fallback callback은 현재 topic과 mode에 맞는 presentation URL에 `print=true`를 붙여 새 탭을 연다. 버튼은 실행 중 disabled와 loading 상태를 사용하고 완료 후 반드시 복구한다.

- [ ] **Step 6: Document and verify the task**

Run: `python3 tests/verify_structure.py`

브라우저 DOM 검사로 horizontal render zone 안에 `.slide-container.horizontal`과 다섯 카드가 있는지 확인한다. exporter를 의도적으로 throw하는 테스트 호출 후 `#pdf-temp-render-zone`이 0개인지 확인한다. fallback URL이 올바른 topic과 mode를 유지하는지 확인하고 결과를 문서화한다.

- [ ] **Step 7: Commit**

```bash
git add services pages/seminars components/seminar-list.js tests docs
git commit -m "fix: isolate reliable PDF export"
```

---

### Task 6: Remove Legacy Structure and Finalize Current Documentation

**Files:**
- Delete: legacy files and directories listed in Target File Map
- Modify: `tests/verify_structure.py`
- Modify: `docs/architecture.md`
- Modify: `docs/conventions.md`
- Modify: `docs/decisions.md`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`
- Modify or delete after history transfer: `log/code-review-2026-08-03.md`
- Delete after execution is complete: `docs/plan.md`

**Interfaces:**
- Consumes: working page packages, components, services, data and shared CSS from Tasks 1–5
- Produces: one canonical project structure with no stale source or documentation paths

- [ ] **Step 1: Extend the test with forbidden legacy paths and references**

다음 경로가 존재하면 실패하도록 검사한다.

```python
FORBIDDEN_PATHS = [
    "seminar.html",
    "sections",
    "slides",
    "components/level3-seminar-page",
    "components/level4-presentation",
    "components/slide-controller.js",
    "styles/style.css",
    "styles/level1-main",
    "styles/level2-navigation",
    "styles/level3-seminar-page",
    "styles/level4-presentation",
    "tests/verify-structure.ps1",
    "log",
]
```

모든 `.html`, `.css`, `.js`, `.md`, `.py` 파일에서 삭제 대상 경로 참조를 검색하되 `docs/history/2026.md`에 기록된 과거 경로는 예외로 한다.

- [ ] **Step 2: Run the test and verify it fails**

Run: `python3 tests/verify_structure.py`

Expected: FAIL listing the legacy paths that still exist.

- [ ] **Step 3: Remove legacy files after resolving references**

내부 링크와 import가 새 경로만 사용함을 먼저 확인한 뒤 Target File Map의 제거 목록을 삭제한다. 기존 코드 리뷰의 미해결 항목은 `docs/status.md`, 수행 이력은 `docs/history/2026.md`에 이미 보존되었는지 확인한 후 `log/`를 삭제한다.

- [ ] **Step 4: Make current documentation canonical**

`docs/architecture.md`의 목표 구조 안내 문구를 제거하고 실제 최종 트리를 기록한다. `docs/conventions.md`와 `docs/decisions.md`가 구현과 일치하는지 갱신한다. `docs/status.md`에서 해결된 문제를 제거하고 남은 문제만 유지한다. `README.md`의 모든 실행 URL을 실제 경로와 맞춘다.

- [ ] **Step 5: Run complete automated verification**

Run: `python3 tests/verify_structure.py`

Run: `git diff --check`

Expected: both commands exit 0; structure test prints `Structure verification passed.`

- [ ] **Step 6: Run complete browser verification**

Run: `python3 -m http.server 4173`

다음을 데스크톱과 모바일 너비에서 확인한다.

- `/`
- `/pages/seminars/`
- `/pages/presentation/horizontal.html?topic=python-intro`
- `/pages/presentation/horizontal.html?topic=web-intro`
- `/pages/presentation/vertical.html?topic=python-intro`
- `/pages/presentation/vertical.html?topic=web-intro`

각 화면의 콘솔 오류, 내부 링크, 제목, 헤더, 모드 전환, 슬라이드 이동, PDF fallback을 검사한다.

- [ ] **Step 7: Finalize history and remove the transient plan**

`docs/history/2026.md`에 최종 검증 명령과 브라우저 결과, 제거한 레거시 구조, 남은 주의사항을 기록한다. `docs/status.md`를 실제 남은 작업만 포함하도록 갱신한다. 완료된 세부 계획은 역사 기록과 현재 문서가 대체하므로 `docs/plan.md`를 삭제한다.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: complete page package migration"
```

---

## Final Success Criteria

- `python3 tests/verify_structure.py`가 통과한다.
- `git diff --check`가 통과한다.
- 루트 `index.html` 외의 사용자 화면이 모두 `pages/` 아래에 있다.
- 페이지 초기화, 공용 컴포넌트, PDF 서비스, 콘텐츠 데이터의 책임이 분리되어 있다.
- 모든 화면이 `styles/main.css`와 최소한의 `page.css`를 사용한다.
- 슬라이드 헤더, 모드 전환, 내비게이션, PDF DOM과 정리 동작이 검증된다.
- `AGENTS.md`가 모든 변경 작업의 문서화를 강제한다.
- `architecture.md`, `conventions.md`, `decisions.md`, `status.md`는 현재 상태만 설명한다.
- `docs/history/2026.md`에는 요청, 문제, 결정, 수행, 검증, 남은 작업이 기록되어 있다.
