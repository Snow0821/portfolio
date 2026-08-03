export const webIntroData = {
  id: "web-intro",
  format: "introductory-60",
  title: "웹 개론",
  summary: "인터넷 동작 원리부터 HTTP, 웹 아키텍처, HTML/CSS/JavaScript와 브라우저 렌더링을 설명합니다.",
  tags: ["HTML/CSS/JS", "Web Architecture"],
  author: "Snow Choi",
  updated: "2026-08-03",
  audience: "Interested non-specialists",
  prerequisites: [],
  outcomes: [
    "Distinguish the internet network from the web information system.",
    "Describe the web client-server and rendering flow.",
    "Recognize web applications, APIs, and their constraints.",
  ],
  sections: [
    {
      role: "problem",
      title: "연결된 컴퓨터만으로 정보 공유가 될까?",
      blocks: [{
        id: "web-problem-common-information-space",
        type: "paragraph",
        summary: "인터넷은 연결을 제공하는 네트워크이고, 웹은 그 위에서 문서를 연결해 함께 찾고 공유하는 정보 공간입니다.",
        detail: "World Wide Web은 서로 다른 컴퓨터가 같은 방식으로 문서를 가리키고 읽게 하여, 단순한 연결을 공통 정보 체계로 바꿨습니다.",
      }],
    },
    {
      role: "prior-art",
      title: "웹 이전의 방식에는 무엇이 부족했을까?",
      blocks: [{
        id: "web-prior-fragmented-services",
        type: "paragraph",
        summary: "파일 전송 도구와 서비스별 문서 규약은 정보를 옮길 수 있었지만, 서로 연결된 문서를 공통 방식으로 다루기 어려웠습니다.",
        detail: "웹은 모든 기존 도구를 완전히 대체했다는 뜻이 아닙니다. URL과 공개 표준을 통해 문서와 서비스 사이의 연결 비용을 낮춘 새로운 공통층을 제공했습니다.",
      }],
    },
    {
      role: "method",
      title: "웹은 어떤 공통 약속으로 동작할까?",
      blocks: [
        {
          id: "web-method-client-server",
          type: "paragraph",
          summary: "브라우저인 클라이언트가 서버에 요청하면 서버가 자원이나 결과를 응답하는 구조가 웹의 기본 흐름입니다.",
          detail: "사용자가 URL을 입력하면 DNS가 서버 주소를 찾고, HTTP가 요청과 응답의 형식을 정합니다. HTTP는 HTTPS와 함께 안전한 전송의 기반이 되기도 합니다.",
        },
        {
          id: "web-method-trio",
          type: "list",
          items: [
            "HTML은 문서의 구조와 의미를 만듭니다.",
            "CSS는 레이아웃, 색상, 타이포그래피를 정합니다.",
            "JavaScript는 이벤트 처리, 데이터 요청, 동적 UI를 담당합니다.",
          ],
        },
        {
          id: "web-method-code",
          type: "code",
          language: "html",
          caption: "기존 HTML/CSS 카드 예제",
          code: `<!-- HTML 구조 -->
<div class="card">
  <h2>Web Intro</h2>
  <button id="btn">Click Me</button>
</div>

/* CSS 스타일 */
.card {
  background: #ffffff;
  border-radius: 8px;
  padding: 1rem;
}`,
        },
        {
          id: "web-method-rendering",
          type: "paragraph",
          summary: "브라우저는 HTML에서 DOM을, CSS에서 CSSOM을 만든 뒤 이를 결합해 레이아웃과 페인트 과정을 거쳐 화면을 그립니다.",
          detail: "이 흐름을 알면 구조·표현·상호작용을 나누어 설계하고, 화면이 느리거나 예상과 다르게 보일 때 원인을 찾기 쉬워집니다.",
        },
      ],
    },
    {
      role: "cases",
      title: "웹은 문서를 넘어 어디에 쓰일까?",
      blocks: [{
        id: "web-cases-services",
        type: "list",
        items: [
          "지식과 소식을 전달하는 공개와 출판",
          "사용자 입력과 데이터를 다루는 대화형 애플리케이션",
          "다른 프로그램이 기능과 데이터를 연결하는 API",
        ],
      }],
    },
    {
      role: "conclusion",
      title: "열린 웹의 장점과 책임은 무엇일까?",
      blocks: [
        {
          id: "web-conclusion-takeaways",
          type: "summary",
          items: [
            "공개 표준은 다양한 기기와 브라우저에서 상호 운용성을 돕습니다.",
            "의미 있는 HTML과 접근성은 검색과 보조 기술 사용자 모두에게 중요합니다.",
          ],
        },
        {
          id: "web-conclusion-limits",
          type: "paragraph",
          summary: "웹 개발은 보안, 성능, 브라우저 호환성과 빠르게 변하는 도구 생태계의 복잡성을 함께 관리해야 합니다.",
          detail: "열린 표준은 강점이지만, 의존성 선택과 업데이트, 사용자 환경 차이는 제품의 책임으로 남습니다.",
        },
      ],
    },
  ],
  presentation: {
    slides: [
      { id: "cover", type: "cover" },
      { id: "agenda", type: "agenda" },
      { id: "problem", type: "content", sectionRole: "problem", category: "WHY", title: "공통 정보 공간", layout: "stack", blockIds: ["web-problem-common-information-space"] },
      { id: "prior-art", type: "content", sectionRole: "prior-art", category: "CONTEXT", title: "파편화된 이전 방식", layout: "stack", blockIds: ["web-prior-fragmented-services"] },
      { id: "method-protocols", type: "content", sectionRole: "method", category: "METHOD", title: "요청과 공통 언어", layout: "stack", blockIds: ["web-method-client-server", "web-method-trio"] },
      { id: "method-code", type: "content", sectionRole: "method", category: "METHOD", title: "문서가 화면이 되기까지", layout: "split", blockIds: ["web-method-code", "web-method-rendering"] },
      { id: "cases", type: "content", sectionRole: "cases", category: "CASES", title: "문서를 넘어선 웹", layout: "stack", blockIds: ["web-cases-services"] },
      { id: "conclusion", type: "content", sectionRole: "conclusion", category: "CONCLUSION", title: "열린 웹의 책임", layout: "stack", blockIds: ["web-conclusion-takeaways", "web-conclusion-limits"] },
      { id: "outro", type: "outro", title: "Q & A", description: "경청해 주셔서 감사합니다. 질문이 있으시면 편하게 말씀해 주세요." },
    ],
  },
};
