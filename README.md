# Portfolio

Snow Choi의 연구, 강의 경력과 세미나 자료를 제공하는 정적 포트폴리오 사이트입니다. 프런트엔드는 HTML, CSS, JavaScript ES module로 구성하고 Vercel에 배포합니다.

## 빠른 시작

Node.js 환경을 준비한 뒤 프로젝트 의존성을 설치하고 로컬 Vercel 서버를 실행합니다.

```bash
fnm use
npm install
npm run dev
```

정적 페이지만 빠르게 확인할 때는 Python 기본 HTTP 서버도 사용할 수 있습니다.

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 엽니다.

## Node.js 개발 환경

Vercel Functions, 로컬 Vercel 실행과 자동 검증에 Node.js 24를 사용합니다. 시스템 Node를 직접 고정 설치하지 않고 `fnm`으로 프로젝트별 버전을 관리합니다.

### Homebrew 없이 fnm 설치

다음 명령은 `fnm`을 사용자 디렉터리의 `~/.local/bin`에 설치하고 셸 설정 자동 수정을 생략합니다.

```bash
mkdir -p "$HOME/.local/bin"

curl -fsSL https://fnm.vercel.app/install \
  | bash -s -- \
      --force-install \
      --install-dir "$HOME/.local/bin" \
      --skip-shell
```

`~/.zshrc`에 다음 설정을 직접 추가합니다.

```bash
export PATH="$HOME/.local/bin:$PATH"
eval "$(fnm env --use-on-cd --shell zsh)"
```

새 터미널을 열거나 현재 셸에 설정을 적용합니다.

```bash
source "$HOME/.zshrc"
fnm --version
```

`fnm: command not found`가 표시되면 바이너리와 `PATH`를 확인합니다.

```bash
ls -l "$HOME/.local/bin/fnm"
printf '%s\n' "$PATH" | tr ':' '\n'
```

### Node.js 24 설치 및 사용

프로젝트 루트의 `.node-version`에는 `24`가 선언되어 있습니다. 프로젝트 디렉터리에서 다음 명령을 실행합니다.

```bash
fnm install
fnm use
node --version
npm --version
```

`--use-on-cd` 설정이 적용되어 있으면 이후 이 프로젝트 디렉터리에 들어올 때 Node 24가 자동으로 선택됩니다.

## Vercel 개발 흐름

정적 페이지와 Vercel Functions를 함께 확인하거나 자동 검증을 실행할 때는 다음 명령을 사용합니다.

```bash
npm install
npm run dev
npm test
```

- `npm run dev`: 정적 페이지와 Vercel Functions를 로컬에서 함께 실행
- `npm test`: 프로젝트 구조와 동작 검증

Vercel CLI를 처음 사용하는 환경에서는 `npm run dev`가 계정 인증과 프로젝트 연결을 요구할 수 있습니다. 이때 다음 명령으로 사용자 계정에 직접 연결한 뒤 다시 실행합니다.

```bash
npx vercel login
npx vercel link
npm run dev
```

## 주요 URL

- 홈: `/`
- 세미나 목록: `/pages/seminars/`
- 발표용 슬라이드: `/pages/presentation/horizontal.html?topic=python-intro`
- 읽기용 문서: `/pages/presentation/vertical.html?topic=python-intro`
- API 상태: `/api/health`

## 세미나 주제 추가

1. `data/topics/<topic-id>.js`에 기존 주제와 같은 형태로 발표 슬라이드와 읽기 문서 데이터를 작성합니다.
2. `data/seminars.js`에서 새 데이터를 import하고 `seminarsDatabase`와 `seminarList`에 등록합니다.
3. `npm test`를 실행하고 세미나 목록과 두 presentation 모드를 브라우저에서 확인합니다.
4. 관련 현재 문서와 `docs/history/<year>.md`에 변경 및 검증 결과를 기록합니다.

## 프로젝트 문서

- [구조와 철학](./docs/architecture.md)
- [구현 규칙](./docs/conventions.md)
- [현재 결정](./docs/decisions.md)
- [현재 상태](./docs/status.md)
- [2026년 작업 이력](./docs/history/2026.md)
