export const webIntroData = {
  id: "web-intro",
  title: "웹 개론",
  subtitle: "Introduction to Web Development",
  category: "HTML/CSS/JS / Web Architecture",
  author: "Snow Choi",
  date: "2026",
  summary: "인터넷 동작 원리부터 HTTP 프로토콜, 현대 웹 아키텍처, 그리고 HTML/CSS/JavaScript의 기본 요소와 시맨틱 웹 구조를 설명합니다.",
  tags: ["HTML/CSS/JS", "Web Architecture"],

  // =========================================================================
  // 1. 발표용 슬라이드 내용 (Horizontal Slide Presentation Content)
  // =========================================================================
  slides: [
    {
      type: "cover",
      slideNumber: "SEMINAR SLIDE 02",
      title: "웹 개론",
      subtitle: "Introduction to Web Development",
      description: "웹의 기초 구조, Client-Server 아키텍처, HTTP 프로토콜 및 HTML/CSS/JS 기본 개념 안내 세미나",
      authorInfo: "발표자: Snow Choi | Date: 2026"
    },
    {
      type: "agenda",
      category: "AGENDA",
      title: "세미나 목차",
      items: [
        "1. 웹(Web)의 역사와 개념 — WWW, 클라이언트와 서버의 역할",
        "2. HTTP/HTTPS 통신 — Request & Response 패러다임",
        "3. 웹 3대 요소 (HTML / CSS / JS) — 구조, 스타일, 상호작용",
        "4. DOM과 브라우저 랜더링 — HTML 파싱부터 화면 렌더링까지",
        "5. 현대 웹 생태계 — SPA, Frameworks, 빌드 시스템"
      ],
      footerLeft: "Snow Choi — Web Presentation",
      footerRight: "Slide 02"
    },
    {
      type: "split-code",
      category: "WEB TRIO",
      title: "HTML & CSS 역할 분담",
      pointsTitle: "핵심 역할",
      points: [
        "HTML: 시맨틱 태그 기반 문서 데이터 구조화",
        "CSS: Layout, 색상, 타이포그래피, 반응형 디자인",
        "JS: 이벤트 처리, 데이터 전송, 동적 UI 변환"
      ],
      code: `<!-- HTML 구조 -->\n<div class="card">\n  <h2>Web Intro</h2>\n  <button id="btn">Click Me</button>\n</div>\n\n/* CSS 스타일 */\n.card {\n  background: #ffffff;\n  border-radius: 8px;\n  padding: 1rem;\n}`,
      footerLeft: "Snow Choi — Web Presentation",
      footerRight: "Slide 03"
    },
    {
      type: "summary",
      category: "SUMMARY",
      title: "핵심 요약 (Key Takeaways)",
      items: [
        "웹 기술은 표준화(W3C, WHATWG)를 바탕으로 모든 디바이스에서 접근성을 보장합니다.",
        "HTML5 시맨틱 태그를 잘 활용하는 것이 SEO와 웹 접근성(a11y)의 기본입니다.",
        "Vanilla JS와 현대 CSS 표준만으로도 모듈화되고 뛰어난 성능의 웹 앱을 만들 수 있습니다."
      ],
      footerLeft: "Snow Choi — Web Presentation",
      footerRight: "Slide 04"
    },
    {
      type: "outro",
      subtitle: "THANK YOU",
      title: "Q & A",
      description: "경청해 주셔서 감사합니다. 질문이 있으시면 편하게 말씀해 주세요."
    }
  ],

  // =========================================================================
  // 2. 세로 읽기용 문서 내용 (Vertical Reading Document Handout Content)
  // =========================================================================
  doc: {
    category: "SEMINAR READING HANDOUT",
    title: "웹 개론 (Introduction to Web Development)",
    lead: "인터넷과 웹의 원리, Client-Server 통신 아키텍처, HTTP 프로토콜, 그리고 웹 개발 3대 기술(HTML, CSS, JavaScript)에 대한 체계적인 읽기용 학습 문서입니다.",
    meta: [
      "저자: Snow Choi",
      "분류: 세미나 학습 자료",
      "최종 수정: 2026"
    ],
    sections: [
      {
        title: "1. 웹(Web)의 역사와 동작 원리",
        content: "월드 와이드 웹(World Wide Web, WWW)은 1989년 팀 버너스리(Tim Berners-Lee)에 의해 발명되었습니다. 인터넷이라는 컴퓨터 네트워크망 위에서 작동하는 가장 대표적인 정보 공유 서비스입니다.",
        callout: "🌐 Client-Server Architecture: 클라이언트(사용자의 웹 브라우저)가 서버에 데이터나 웹 페이지를 요청(Request)하면, 서버가 해당 자원을 처리하여 응답(Response)하는 구조입니다.",
        extraContent: "웹 브라우저에 URL을 입력하면, DNS 조회를 통해 서버 IP를 찾고 HTTP 프로토콜로 데이터를 주고받습니다."
      },
      {
        title: "2. 웹을 구성하는 3대 요소 (HTML / CSS / JS)",
        content: "현대 웹 프론트엔드는 역할이 철저히 분리된 3가지 핵심 기술로 구성됩니다.",
        bullets: [
          "HTML (HyperText Markup Language): 웹 문서의 구조와 시맨틱 데이터를 정의합니다.",
          "CSS (Cascading Style Sheets): 레이아웃, 시각적 스타일링, 반응형 디자인을 담당합니다.",
          "JavaScript: 사용자 이벤트 처리, 비동기 데이터 전송(Fetch/Ajax), 동적 UI 변경을 수행합니다."
        ],
        code: `<!-- 시맨틱 HTML5 구조 예시 -->\n<article class="card">\n  <header>\n    <h2>웹 개발 기본</h2>\n  </header>\n  <p>시맨틱 태그는 검색엔진(SEO)과 접근성(a11y)에 매우 중요합니다.</p>\n  <button id="theme-btn">다크모드 전환</button>\n</article>\n\n/* Vanilla CSS - Design System */\n.card {\n  background-color: var(--color-surface);\n  border: 1px solid var(--color-line);\n  padding: 1.5rem;\n  border-radius: 8px;\n}`
      },
      {
        title: "3. 브라우저 렌더링 파이프라인 (DOM & CSSOM)",
        content: "브라우저가 HTML 문서를 전달받으면 DOM Tree를 생성하고, CSS를 파싱하여 CSSOM Tree를 구축합니다. 두 트리가 결합하여 Render Tree가 만들어지며, 이후 Layout과 Paint 과정을 거쳐 화면에 그려집니다."
      },
      {
        title: "4. 요약 및 학습 가이드",
        content: "프레임워크(React, Next.js 등)에 종속되기 전, 웹의 근본이 되는 표준 웹 API와 시맨틱 구조, 모던 CSS 및 JS 기초를 튼튼히 하는 것이 오래 지속 가능한 개발자 성장의 핵심입니다."
      }
    ]
  }
};
