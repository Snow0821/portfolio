# 프로젝트 코드 리뷰 — 2026-08-03

## 요약

프로젝트는 데이터와 렌더러가 분리되어 있고, CSS 구조도 역할별로 정리되어 있어 확장 방향이 좋다. 홈 화면의 비동기 섹션 로딩과 주요 시맨틱 구조도 정상적으로 동작한다.

현재는 슬라이드 헤더와 PDF 생성 기능에 사용자 동작을 직접 방해하는 문제가 있으므로 아래 순서로 수정하는 것을 권장한다.

1. 슬라이드 헤더 속성 반영
2. 가로 PDF 임시 DOM 구조 수정
3. 구조 검증 테스트 갱신
4. PDF 실패 시 정리 로직 보강
5. 문구 및 접근성 개선

## 발견 사항

### [높음] 슬라이드 헤더가 동적으로 설정된 속성을 반영하지 않음

- 관련 파일: `components/slide-header.js`, `slides/viewer-horizontal.html`, `slides/viewer-vertical.html`
- `slide-header`는 `connectedCallback()`에서 한 번만 렌더링한다.
- 제목, 배지, 보기 전환 링크, 발표 모드 속성은 커스텀 엘리먼트가 연결된 후 설정된다.
- 실제 브라우저 확인 결과:
  - 헤더 제목이 비어 있음
  - 배지가 표시되지 않음
  - 보기 전환 링크가 `#`로 남음
  - 읽기용 문서에도 슬라이드 카운터와 이전/다음 버튼이 표시됨
- 권장 조치: `observedAttributes`와 `attributeChangedCallback()`을 구현하거나, 속성 설정 후 컴포넌트를 명시적으로 다시 렌더링한다.

### [높음] 가로 PDF 생성 DOM 구조가 CSS 및 후처리 조건과 불일치

- 관련 파일: `components/level3-seminar-page/seminar-list-renderer.js`
- 임시 PDF 컨테이너 자체에 슬라이드를 바로 렌더링하지만, 이후 내부의 `.slide-container.horizontal` 요소를 찾는다.
- 해당 요소가 생성되지 않으므로 `slideBox`는 항상 `null`이 된다.
- 결과적으로 슬라이드 크기, 페이지 나누기 설정과 `.slide-container.horizontal .slide-card` CSS가 적용되지 않는다.
- 권장 조치: 실제 viewer와 동일하게 임시 컨테이너 안에 `.slide-container.horizontal` 요소를 만든 후 그 요소에 슬라이드를 렌더링한다.

### [중간] 구조 검증 테스트가 현재 디렉터리 구조와 불일치

- 관련 파일: `tests/verify-structure.ps1`
- 테스트가 이미 삭제되거나 이동된 다음 파일을 필수 파일로 검사한다.
  - `styles/base.css`
  - `styles/layout.css`
  - `styles/components/header.css`
  - `styles/components/seminar.css`
- 현재 구조인 `level1-main`, `level2-navigation`, `level3-seminar-page`, `level4-presentation` 경로를 검증하도록 갱신해야 한다.

### [중간] PDF 생성 실패 시 임시 DOM이 남음

- 관련 파일: `components/level3-seminar-page/seminar-list-renderer.js`
- 임시 PDF 컨테이너 제거가 성공 경로에만 있다.
- `html2pdf().save()`가 실패하면 숨겨진 컨테이너가 문서에 남고, 재시도할 때 중복 요소가 쌓일 수 있다.
- 권장 조치: 임시 컨테이너 변수를 바깥 범위에 선언하고 제거 로직을 `finally`로 옮긴다.

### [낮음] Markdown 강조 문법이 HTML에서 그대로 노출됨

- 관련 파일: `seminar.html`
- `**세로 문서(읽기용)**`, `**가로 슬라이드**`가 별표를 포함한 일반 텍스트로 표시된다.
- 권장 조치: `<strong>` 요소를 사용한다.

### [낮음] PDF 다운로드 버튼의 접근성 이름이 불명확함

- 관련 파일: `components/level3-seminar-page/seminar-list-renderer.js`
- 네 개의 다운로드 버튼이 접근성 트리에서 모두 `📥`로 읽힌다.
- 권장 조치: 주제와 문서 형식을 포함한 `aria-label`을 추가한다. 예: `파이썬 개론 읽기용 문서 PDF 다운로드`.

## 긍정적인 부분

- 세미나 데이터를 `data/topics` 아래에 분리하여 새 주제를 추가하기 쉽다.
- 홈 화면의 비동기 섹션 로딩이 정상 동작하며 확인 당시 콘솔 오류가 없었다.
- `section`, `article`, 제목 계층과 주요 내비게이션 레이블이 비교적 잘 구성되어 있다.
- CSS가 역할과 화면 수준별로 나뉘어 있어 규모 확장 시 유지보수에 유리하다.

## 검토 범위

- 정적 코드와 현재 작업 트리 구조 검토
- 로컬 HTTP 서버에서 홈, 세미나 목록, 가로 슬라이드, 세로 문서 브라우저 동작 확인
- 코드 변경 없이 피드백만 기록
