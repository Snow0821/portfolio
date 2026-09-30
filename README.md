# Mint

작은 개인용 Todo 앱입니다. 첫 화면(`/`)과 `/mint/`에서 같은 앱을 열 수 있습니다.

- 로그인: 아이디 `admin`을 Supabase Auth 계정에 연결합니다. 비밀번호는 코드에 저장하지 않습니다.
- 화면: HTML, CSS, JavaScript / Vercel
- API: Render의 Mint FastAPI 서비스
- 데이터: Supabase PostgreSQL, 계정별 RLS
- 기존 Hangul Lens 앱은 `/ocr/`에서 사용할 수 있습니다.

`npm ci`, `npm test`, `npm run build`로 검증하고 빌드합니다.
`mint/config.js`에는 API 주소와 공개용 Supabase 키만 들어 있습니다.
