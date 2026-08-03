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

향후 Vercel Functions, 로컬 Vercel 실행과 자동 검증을 위해 Node.js 24를 사용합니다. 시스템 Node를 직접 고정 설치하지 않고 `fnm`으로 프로젝트별 버전을 관리합니다.

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

## 프로젝트 문서

- [구조와 철학](./docs/architecture.md)
- [현재 상태](./docs/status.md)
- [현재 구현 계획](./docs/plan.md)
- [2026년 작업 이력](./docs/history/2026.md)
