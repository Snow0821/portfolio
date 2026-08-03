import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { pythonIntroData } from "../data/topics/python-intro.js";
import { getSeminar, getSeminarList } from "../data/seminars.js";
import { webIntroData } from "../data/topics/web-intro.js";
import { SECTION_ROLES, validateSeminar } from "../data/validation.js";

const projectRoot = resolve(import.meta.dirname, "../../..");
const expectedTopics = {
  "python-intro": {
    summary: "프로그래밍 입문자를 위한 파이썬 기초 문법, 핵심 데이터 구조, 변수 및 제어문 개념을 다룹니다.",
    titles: [
      "프로그래밍은 왜 어렵게 느껴질까?",
      "기존 언어는 무엇을 요구했을까?",
      "파이썬은 무엇을 단순하게 만들까?",
      "파이썬은 어디에서 쓰일까?",
      "무엇을 기억하고 조심해야 할까?",
    ],
    blockIds: [
      "python-problem-entry-barrier", "python-prior-explicit-machinery",
      "python-method-principles", "python-method-types", "python-method-code",
      "python-method-control", "python-method-reading-code", "python-cases-ecosystem",
      "python-conclusion-takeaways", "python-conclusion-limits",
    ],
    examples: {
      "python-method-code": `# 파이썬 기초 변수 예시
name = "Snow Choi"
age = 28
skills = ["Python", "Web", "AI"]

# Dict 구조
profile = {
    "role": "Researcher",
    "active": True
}

print(f"Hello, {name}!")`,
      "python-method-reading-code": `# 파이썬 기본 데이터 타입 실습 예제
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
  },
  "web-intro": {
    summary: "인터넷 동작 원리부터 HTTP 프로토콜, 현대 웹 아키텍처, 그리고 HTML/CSS/JavaScript의 기본 요소와 시맨틱 웹 구조를 설명합니다.",
    titles: [
      "연결된 컴퓨터만으로 정보 공유가 될까?",
      "웹 이전의 방식에는 무엇이 부족했을까?",
      "웹은 어떤 공통 약속으로 동작할까?",
      "웹은 문서를 넘어 어디에 쓰일까?",
      "열린 웹의 장점과 책임은 무엇일까?",
    ],
    blockIds: [
      "web-problem-common-information-space", "web-prior-fragmented-services",
      "web-method-client-server", "web-method-trio", "web-method-code",
      "web-method-rendering", "web-method-reading-code", "web-cases-services",
      "web-conclusion-takeaways", "web-conclusion-limits",
    ],
    examples: {
      "web-method-code": `<!-- HTML 구조 -->
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
      "web-method-reading-code": `<!-- 시맨틱 HTML5 구조 예시 -->
<article class="card">
  <header>
    <h2>웹 개발 기본</h2>
  </header>
  <p>시맨틱 태그는 검색엔진(SEO)과 접근성(a11y)에 매우 중요합니다.</p>
  <button id="theme-btn">다크모드 전환</button>
</article>

/* Vanilla CSS - Design System */
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  padding: 1.5rem;
  border-radius: 8px;
}`,
    },
  },
};
const expectedSlides = [
  ["cover", null, null], ["agenda", null, null],
  ["content", "problem", "stack"], ["content", "prior-art", "stack"],
  ["content", "method", "stack"], ["content", "method", "split"],
  ["content", "cases", "stack"], ["content", "conclusion", "stack"],
  ["outro", null, null],
];

function imageBlocks(topic) {
  return topic.sections.flatMap(({ blocks }) => blocks.filter(({ type }) => type === "image"));
}

test("provides the two migrated introductory seminars through the lazy registry", () => {
  assert.deepEqual(getSeminarList().map(({ id }) => id), ["python-intro", "web-intro"]);
  assert.equal(getSeminar("python-intro"), pythonIntroData);
  assert.equal(getSeminar("web-intro"), webIntroData);
  assert.equal(getSeminar("missing"), null);
});

test("keeps migrated seminar content valid, structured, and free of legacy view data", () => {
  for (const topic of getSeminarList()) {
    assert.equal(validateSeminar(topic), topic);
    assert.equal("slides" in topic, false);
    assert.equal("doc" in topic, false);
    assert.deepEqual(topic.sections.map(({ role }) => role), SECTION_ROLES);
    assert.deepEqual(
      new Set(topic.presentation.slides.filter(({ type }) => type === "content").map(({ sectionRole }) => sectionRole)),
      new Set(SECTION_ROLES),
    );
  }
});

test("preserves the required visible structure, slide plan, and legacy source facts", () => {
  for (const topic of getSeminarList()) {
    const expected = expectedTopics[topic.id];
    const blocks = topic.sections.flatMap(({ blocks }) => blocks);
    assert.equal(topic.summary, expected.summary);
    assert.deepEqual(topic.sections.map(({ title }) => title), expected.titles);
    assert.deepEqual(blocks.map(({ id }) => id), expected.blockIds);
    assert.deepEqual(
      topic.presentation.slides.map(({ type, sectionRole = null, layout = null }) => [type, sectionRole, layout]),
      expectedSlides,
    );
    assert.deepEqual(topic.presentation.slides.filter(({ layout }) => layout === "split").map(({ id }) => id), ["method-code"]);
    for (const [id, code] of Object.entries(expected.examples)) {
      assert.equal(blocks.find((block) => block.id === id)?.code, code);
    }
  }
});

test("references only existing topic-local production images", () => {
  for (const topic of getSeminarList()) {
    for (const block of imageBlocks(topic)) {
      assert.equal(existsSync(resolve(projectRoot, block.src.slice(1))), true, block.src);
    }
  }
});
