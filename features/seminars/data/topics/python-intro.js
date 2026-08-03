export const pythonIntroData = {
  id: "python-intro",
  format: "introductory-60",
  title: "파이썬 개론",
  summary: "프로그래밍 입문자를 위한 파이썬 기초 문법, 핵심 데이터 구조, 변수 및 제어문 개념을 다룹니다.",
  tags: ["Python", "기초 입문"],
  author: "Snow Choi",
  updated: "2026-08-03",
  audience: "Interested non-specialists",
  prerequisites: [],
  outcomes: [
    "Explain why Python lowers the entry barrier to programming.",
    "Recognize Python data structures and control flow.",
    "Identify appropriate Python use cases and limits.",
  ],
  sections: [
    {
      role: "problem",
      title: "프로그래밍은 왜 어렵게 느껴질까?",
      blocks: [{
        id: "python-problem-entry-barrier",
        type: "paragraph",
        summary: "반복 작업과 데이터 처리를 정확한 명령으로 표현하려면 처음에는 높은 진입 장벽을 넘어서야 합니다.",
        detail: "문제를 작은 단계로 나누고, 컴퓨터가 해석할 수 있는 형태로 빠짐없이 적는 일은 자연어로 설명하는 일과 다릅니다. 그래서 입문자는 문법뿐 아니라 문제를 절차로 바꾸는 사고방식도 함께 익혀야 합니다.",
      }],
    },
    {
      role: "prior-art",
      title: "기존 언어는 무엇을 요구했을까?",
      blocks: [{
        id: "python-prior-explicit-machinery",
        type: "paragraph",
        summary: "C와 Java 같은 언어에서는 명시적 타입과 컴파일·도구 단계를 다루는 일이 중요한 작업 흐름의 일부입니다.",
        detail: "이런 선택은 큰 시스템에서 예측 가능성과 도구 지원을 제공할 수 있습니다. 파이썬은 이 언어들이 열등하다고 말하는 대신, 입문과 빠른 실험에서 필요한 표현을 더 직접적으로 쓰게 하는 다른 균형을 제안합니다.",
      }],
    },
    {
      role: "method",
      title: "파이썬은 무엇을 단순하게 만들까?",
      blocks: [
        {
          id: "python-method-principles",
          type: "paragraph",
          summary: "파이썬은 읽기 쉬운 문법과 실행 가능한 작은 실험을 중심에 둡니다.",
          detail: "명시적인 것이 암묵적인 것보다 낫고, 단순함이 복잡함보다 낫다는 Zen of Python의 방향은 코드 읽기와 협업에도 도움이 됩니다.",
        },
        {
          id: "python-method-types",
          type: "list",
          items: [
            "동적 타이핑은 값에 맞는 타입을 실행 중에 다룰 수 있게 합니다.",
            "Numbers, Strings, Booleans, List, Dictionary가 기본 자료 표현을 제공합니다.",
            "들여쓰기는 코드 블록의 범위를 드러내어 구조를 읽기 쉽게 합니다.",
          ],
        },
        {
          id: "python-method-code",
          type: "code",
          language: "python",
          caption: "기존 프로필 예제",
          code: `# 파이썬 기초 변수 예시
name = "Snow Choi"
age = 28
skills = ["Python", "Web", "AI"]

# Dict 구조
profile = {
    "role": "Researcher",
    "active": True
}

print(f"Hello, {name}!")`,
        },
        {
          id: "python-method-control",
          type: "paragraph",
          summary: "if와 for/while은 조건에 따라 판단하고 반복 작업을 자동화하는 제어 흐름입니다.",
          detail: "함수는 def로 이름 붙인 동작을 재사용하게 하며, 컬렉션과 함께 데이터 처리 과정을 작은 단위로 정리하게 합니다.",
        },
        {
          id: "python-method-reading-code",
          type: "code",
          language: "python",
          caption: "기존 기본 데이터 타입 실습 예제",
          code: `# 파이썬 기본 데이터 타입 실습 예제
user_name = "Snow Choi"       # str
user_age = 28                 # int
is_researcher = True          # bool

# List 예시
skills = ["Python", "Machine Learning", "Web"]

# Dictionary 예시
profile = {
    "name": user_name,
    "age": user_age,
    "role": "Lecturer & Researcher"
}

print(f"Hello, {user_name}!")`,
        },
      ],
    },
    {
      role: "cases",
      title: "파이썬은 어디에서 쓰일까?",
      blocks: [{
        id: "python-cases-ecosystem",
        type: "list",
        items: [
          "반복적인 파일·데이터 작업을 줄이는 자동화 스크립트",
          "Django와 FastAPI를 포함한 웹 개발",
          "데이터 분석과 시각화",
          "PyTorch와 TensorFlow를 활용하는 AI·머신러닝",
        ],
      }],
    },
    {
      role: "conclusion",
      title: "무엇을 기억하고 조심해야 할까?",
      blocks: [
        {
          id: "python-conclusion-takeaways",
          type: "summary",
          items: [
            "파이썬은 가독성과 풍부한 생태계로 빠른 학습과 실험을 돕습니다.",
            "작은 스크립트부터 데이터 분석과 웹 개발까지 같은 기초를 확장할 수 있습니다.",
          ],
        },
        {
          id: "python-conclusion-limits",
          type: "paragraph",
          summary: "동적 타이핑은 런타임 타입 오류로 이어질 수 있고, 성능에 민감한 작업에는 다른 선택이 더 적합할 수 있습니다.",
          detail: "언어 선택은 유행보다 작업의 성능 요구, 팀의 경험, 라이브러리와 배포 환경을 함께 살피는 생태계 선택입니다.",
        },
      ],
    },
  ],
  presentation: {
    slides: [
      { id: "cover", type: "cover" },
      { id: "agenda", type: "agenda" },
      { id: "problem", type: "content", sectionRole: "problem", category: "WHY", title: "프로그래밍의 첫 장벽", layout: "stack", blockIds: ["python-problem-entry-barrier"] },
      { id: "prior-art", type: "content", sectionRole: "prior-art", category: "CONTEXT", title: "기존 언어의 균형", layout: "stack", blockIds: ["python-prior-explicit-machinery"] },
      { id: "method-basics", type: "content", sectionRole: "method", category: "METHOD", title: "읽기 쉬운 기본 원리", layout: "stack", blockIds: ["python-method-principles", "python-method-types"] },
      { id: "method-code", type: "content", sectionRole: "method", category: "METHOD", title: "자료와 제어 흐름", layout: "split", blockIds: ["python-method-code", "python-method-control"] },
      { id: "cases", type: "content", sectionRole: "cases", category: "CASES", title: "파이썬의 활용", layout: "stack", blockIds: ["python-cases-ecosystem"] },
      { id: "conclusion", type: "content", sectionRole: "conclusion", category: "CONCLUSION", title: "기억할 점과 한계", layout: "stack", blockIds: ["python-conclusion-takeaways", "python-conclusion-limits"] },
      { id: "outro", type: "outro", title: "Q & A", description: "경청해 주셔서 감사합니다. 질문이 있으시면 편하게 말씀해 주세요." },
    ],
  },
};
