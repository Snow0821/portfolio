# Tests

## Purpose

Node.js 표준 테스트 러너로 프로젝트 구조와 사용자에게 보이는 핵심 동작을 검증한다.

## Test files

- `foundation.test.mjs`: 개발 환경, Vercel과 health function
- `home.test.mjs`: 홈 기반과 사이트 헤더
- `seminars.test.mjs`: 세미나 목록, 다운로드 상태와 인쇄 URL
- `presentation.test.mjs`: presentation 페이지, 주제와 헤더
- `pdf.test.mjs`: PDF 렌더 구조, 정리와 fallback
- `module-policy.test.mjs`: 파일 길이와 로컬 ES module import
- `structure.test.mjs`: 레거시 부재와 로컬 참조

## Helpers

공통 fake DOM과 파일 탐색은 `tests/helpers/`에 둔다. helper는 테스트 runner의 직접 진입점이 아니다.

## Commands

```bash
fnm exec --using=24 npm test
```

개별 파일은 `node --test tests/<domain>.test.mjs`로 실행한다.

실행 JavaScript, CSS와 테스트는 200줄 이하를 기본으로 한다. 201~300줄은 `module-policy.test.mjs`에 경로와 구체적인 이유가 있는 예외만 허용하며 300줄 초과는 항상 실패한다. `data/`, `content/`, `docs/`, lockfile과 외부 의존성은 검사하지 않는다.

## Adding a test

사용자 동작이나 모듈 경계를 소유하는 도메인 파일에 테스트를 추가한다. 반복되는 테스트 전용 구현만 helper로 옮긴다.
