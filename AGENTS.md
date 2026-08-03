# Project Working Rules

## Required documentation

- 프로젝트 파일을 변경한 모든 작업은 같은 작업 안에서 관련 현재 문서와 `docs/history/<year>.md`를 갱신한다.
- 구조 변경은 `docs/architecture.md`, 규칙 변경은 `docs/conventions.md`, 장기 결정 변경은 `docs/decisions.md`, 현재 상태 변경은 `docs/status.md`에 반영한다.
- 실행한 자동 테스트와 브라우저 검증 결과를 작업 이력에 기록한다.
- 문서화가 끝나지 않은 작업은 완료로 간주하지 않는다.

## Architecture

- 루트 `index.html` 외의 사용자 화면은 `pages/` 아래에 둔다.
- 페이지는 조립만 담당하고 재사용 UI는 `components/`, 비-UI 기능은 `services/`, 콘텐츠 데이터는 `data/`, Vercel Functions는 `api/`에 둔다.
- 공통 CSS를 우선하고 페이지 CSS에는 해당 화면에서만 필요한 배치와 예외를 둔다.
- 프런트엔드는 빌드 없는 정적 HTML, CSS, JavaScript ES module을 유지한다.

## Development environment

- `.node-version`과 `package.json#engines.node`는 Node.js `24.x`로 유지한다.
- Vercel CLI를 포함한 JavaScript 도구는 프로젝트 `devDependencies`에 고정하고 전역 설치를 요구하지 않는다.
- Docker는 현재 개발 또는 운영 흐름에 추가하지 않는다.

## Verification

- 완료를 보고하기 전에 `npm test`와 `git diff --check`를 실행한다.
- 사용자 동작이나 레이아웃을 변경한 경우 로컬 서버에서 관련 화면을 브라우저로 확인한다.
- Vercel Functions 또는 라우팅을 변경한 경우 `npm run dev:vercel`에서 관련 API를 확인한다.
