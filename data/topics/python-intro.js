export const pythonIntroData = {
  id: "python-intro",
  title: "파이썬 개론",
  subtitle: "Introduction to Python",
  category: "Python / 기초 입문",
  author: "Snow Choi",
  date: "2026",
  summary: "프로그래밍 입문자를 위한 파이썬 기초 문법, 핵심 데이터 구조, 변수 및 제어문 개념을 다룹니다.",
  tags: ["Python", "기초 입문"],

  // =========================================================================
  // 1. 발표용 슬라이드 내용 (Horizontal Slide Presentation Content)
  // =========================================================================
  slides: [
    {
      type: "cover",
      slideNumber: "SEMINAR SLIDE 01",
      title: "파이썬 개론",
      subtitle: "Introduction to Python",
      description: "프로그래밍 입문자를 위한 파이썬 기초 문법, 핵심 데이터 구조, 변수 및 제어문 개념 안내 세미나",
      authorInfo: "발표자: Snow Choi | Date: 2026"
    },
    {
      type: "agenda",
      category: "AGENDA",
      title: "세미나 목차",
      items: [
        "1. 파이썬이란 무엇인가? — 파이썬의 핵심 철학과 인터프리터 언어의 특징",
        "2. 기본 데이터 타입 & 변수 — Numbers, Strings, Booleans, List, Dict",
        "3. 제어 흐름 (Control Flow) — if 조건문과 for/while 반복문 구조",
        "4. 함수와 모듈성 — def 키워드와 함수 재사용성",
        "5. 간단한 실습 예제 — 데이터 처리 및 문자열 가공 연습"
      ],
      footerLeft: "Snow Choi — Python Presentation",
      footerRight: "Slide 02"
    },
    {
      type: "split-code",
      category: "CORE SYNTAX",
      title: "변수 선언과 데이터 타입 예시",
      pointsTitle: "특징 및 규칙",
      points: [
        "동적 타이핑(Dynamic Typing) 지원",
        "가독성이 높은 직관적인 들여쓰기(Indentation)",
        "다양한 내장 컬렉션 자료형 제공"
      ],
      code: `# 파이썬 기초 변수 예시\nname = "Snow Choi"\nage = 28\nskills = ["Python", "Web", "AI"]\n\n# Dict 구조\nprofile = {\n    "role": "Researcher",\n    "active": True\n}\n\nprint(f"Hello, {name}!")`,
      footerLeft: "Snow Choi — Python Presentation",
      footerRight: "Slide 03"
    },
    {
      type: "summary",
      category: "SUMMARY",
      title: "핵심 요약 (Key Takeaways)",
      items: [
        "파이썬은 쉬운 문법과 강력한 생태계를 갖춘 다목적 프로그래밍 언어입니다.",
        "코드 가독성(Readability)이 뛰어난 디자인 언어로 빠르게 아이디어를 구현할 수 있습니다.",
        "웹 개발, 데이터 분석, 인공지능 연구 등 다양한 영역으로 확장 가능합니다."
      ],
      footerLeft: "Snow Choi — Python Presentation",
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
    title: "파이썬 개론 (Introduction to Python)",
    lead: "프로그래밍 입문자를 위한 파이썬의 핵심 철학, 기초 문법, 주요 데이터 타입 및 제어 구조에 대한 상세 읽기용 학습 문서입니다.",
    meta: [
      "저자: Snow Choi",
      "분류: 세미나 학습 자료",
      "최종 수정: 2026"
    ],
    sections: [
      {
        title: "1. 파이썬이란 무엇인가?",
        content: "파이썬(Python)은 1991년 휘도 반 로섬(Guido van Rossum)이 발표한 고급 인터프리터 언어입니다. 'Life is too short, You need Python'이라는 슬로건처럼, 쉬우면서도 강력한 가독성을 제공하는 것이 가장 큰 특징입니다.",
        callout: "💡 파이썬의 핵심 철학 (The Zen of Python): 아름다운 것이 추한 것보다 낫고, 명시적인 것이 은연중에 행해지는 것보다 낫습니다. 단순함이 복잡함보다 낫습니다.",
        extraContent: "C나 Java와 같은 컴파일 언어와 달리 코드를 한 줄씩 해석하며 실행하는 인터프리터(Interpreter) 방식을 취하므로, 개발자가 아이디어를 빠르게 테스트하고 프로토타입을 제작하기에 매우 유리합니다."
      },
      {
        title: "2. 기본 데이터 타입과 변수",
        content: "파이썬은 변수를 선언할 때 타입을 명시하지 않는 동적 타이핑(Dynamic Typing) 언어입니다. 기본적으로 다음과 같은 주요 타입들을 제공합니다.",
        bullets: [
          "Numbers: 정수(int) 및 실수(float)",
          "Strings: 홑따옴표(' ') 또는 쌍따옴표(\" \")로 둘러싸인 문자열",
          "List: 순서가 있고 변경 가능한(Mutable) 배열 형태의 자료형",
          "Dictionary: Key-Value 쌍으로 데이터를 관리하는 개체형 자료형"
        ],
        code: `# 파이썬 기본 데이터 타입 실습 예제\nuser_name = "Snow Choi"       # str\nuser_age = 28                 # int\nis_researcher = True          # bool\n\n# List 예시\nskills = ["Python", "Machine Learning", "Web"]\n\n# Dictionary 예시\nprofile = {\n    "name": user_name,\n    "age": user_age,\n    "role": "Lecturer & Researcher"\n}\n\nprint(f"Hello, {user_name}!")`
      },
      {
        title: "3. 제어 흐름 (Control Flow)",
        content: "파이썬에서는 중괄호({ }) 대신 들여쓰기(Indentation)를 이용해 코드 블록의 범위를 구분합니다. 기본 들여쓰기 표준은 공백 4칸(4 spaces)입니다.",
        subsections: [
          {
            heading: "if 조건문",
            text: "조건의 참/거짓 판단에 따라 특정 코드를 실행합니다."
          },
          {
            heading: "for 및 while 반복문",
            text: "리스트나 범위(range) 객체의 요소를 순회할 때 for ... in 구문을 활발히 활용합니다."
          }
        ]
      },
      {
        title: "4. 요약 및 학습 가이드",
        content: "파이썬은 간단한 스크립트 작성부터 데이터 분석, 웹 서버 개발(Django, FastAPI), 인공지능 연구(PyTorch, TensorFlow)에 이르기까지 무궁무진한 생태계를 보유하고 있습니다. 본 개론 자료를 바탕으로 직접 코드를 작성하며 익혀보시길 권장합니다."
      }
    ]
  }
};
