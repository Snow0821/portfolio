# Seminar Domain Package Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every seminar-specific implementation into `features/seminars/`, migrate the Python and Web topics to the shared `introductory-60` content contract, and preserve the existing public URLs and output behavior.

**Architecture:** The two `pages/` packages remain thin URL and DOM entrypoints. They call only two public orchestrators exported by `features/seminars/index.js`; all seminar data, validation, components, layouts, assets, PDF lifecycle, styles, and tests stay behind that boundary. Each topic owns one structured source, the reading layout renders the complete source, and the presentation plan references source block IDs without duplicating facts.

**Tech Stack:** Static HTML, CSS, JavaScript ES modules, Node.js 24, Node built-in test runner, local `html2pdf` browser integration with print fallback, no build step.

## Global Constraints

- Keep `.node-version` and `package.json#engines.node` at Node.js `24.x`.
- Do not add a framework, bundler, generated `dist/`, Docker, or a new runtime dependency.
- Keep every executable JavaScript, CSS, and test file at 200 lines or fewer; do not add a file-length exception for this migration.
- Keep `/pages/seminars/`, `/pages/presentation/horizontal.html?topic=<id>`, and `/pages/presentation/vertical.html?topic=<id>` unchanged.
- `pages/` may import only `features/seminars/index.js`; it may not deep-import feature data, components, layouts, or services.
- `features/seminars/` may depend on `utils/html.js` and global CSS tokens, but global modules may not depend on seminar internals.
- `introductory-60` targets interested non-specialists and uses `problem → prior-art → method → cases → conclusion` in that order; visible section titles remain topic-specific.
- `60` is a format name, not a slide, word, or time budget. Reading content must not be removed to fit a live presentation.
- Quantitative density may produce author guidance only; missing content, invalid references, accessibility metadata failures, DOM overflow, or clipping are errors.
- Preserve the user's untracked `.vscode/` directory and any unrelated worktree changes.
- Normalize repository-relative paths before comparing them so tests use the same slash-form contract on Windows and POSIX.
- Wait for fonts, images, and one animation frame before reporting rendered layout overflow.
- For every task, append the observed RED/GREEN commands and any newly discovered `확인`, `해결`, or `보류` item to the active entry in `docs/history/2026.md`; keep unresolved items in `docs/status.md`.
- Before completion, run `npm test`, `git diff --check`, and browser verification for the changed seminar routes. Absorb this plan and the design specification into canonical documents, then remove both temporary files.

Commands in this plan assume Node.js 24 is already active. Use `node` directly for focused tests, `npm` on POSIX, and `npm.cmd` in Windows PowerShell. Do not depend on a machine-specific absolute `fnm` path; record the actual command used in the history.

---

## Target File Map

### Create

```text
features/seminars/
├── README.md                         # Domain boundary, public API, lifecycle, extension rules
├── index.js                          # Re-export only the two page orchestrators
├── seminars-page.js                  # List-page orchestration and PDF download flow
├── presentation-page.js              # Topic/mode resolution, rendering, header, print, error state
├── formats/
│   └── introductory-60.md            # Human-facing format rules
├── data/
│   ├── seminars.js                   # Lazy-validated registry accessors
│   ├── validation.js                 # Machine-enforced topic contract
│   └── topics/
│       ├── python-intro.js           # Python shared source and slide references
│       └── web-intro.js              # Web shared source and slide references
├── assets/                           # Create topic folders only when assets exist
├── components/
│   ├── content-block.js              # Safe semantic block markup for both views
│   ├── error-state.js                # User-visible load failure state
│   ├── presentation-controller.js    # Horizontal navigation lifecycle
│   ├── seminar-list.js               # List cards and download state
│   └── slide-header.js               # Reactive presentation custom element
├── layouts/
│   ├── overflow.js                   # Rendered layout boundary inspection
│   ├── presentation-slides.js        # Slide plan projection over source blocks
│   └── reading-document.js           # Complete reading projection
├── services/pdf/
│   ├── README.md                     # PDF contract and cleanup lifecycle
│   ├── exporter.js
│   └── render-zone.js
├── styles/
│   ├── index.css                     # Seminar feature CSS entrypoint
│   ├── seminar-list.css
│   ├── content-block.css
│   ├── presentation-header.css
│   ├── presentation-layout.css
│   ├── presentation-slide.css
│   ├── reading-document.css
│   └── print.css
└── tests/
    ├── fixtures.mjs                  # Minimal valid topic factory
    ├── contract.test.mjs
    ├── data.test.mjs
    ├── layouts.test.mjs
    ├── seminar-list.test.mjs
    ├── presentation-components.test.mjs
    ├── pages.test.mjs
    ├── pdf.test.mjs
    └── structure.test.mjs
```

Create `features/seminars/assets/<topic-id>/` only when a topic receives its first stored asset; do not commit empty directories or a placeholder asset file.

### Modify

```text
package.json
README.md
pages/seminars/index.html
pages/seminars/page.js
pages/presentation/horizontal.html
pages/presentation/vertical.html
pages/presentation/page.js
styles/main.css
styles/print.css
tests/README.md
tests/foundation.test.mjs
tests/module-policy.test.mjs
tests/structure.test.mjs
docs/architecture.md
docs/conventions.md
docs/decisions.md
docs/status.md
docs/history/2026.md
```

### Delete after all consumers move

```text
components/seminar-list.js
components/presentation/
data/seminars.js
data/topics/
services/pdf/
styles/components/seminar-card.css
styles/components/presentation/
tests/seminars.test.mjs
tests/presentation.test.mjs
tests/pdf.test.mjs
docs/seminar-domain-design.md
docs/seminar-domain-plan.md
```

## Shared Data Interfaces

Every topic has this top-level shape:

```js
{
  id: "sample-intro",
  format: "introductory-60",
  title: "샘플 개론",
  subtitle: "Sample Introduction",
  summary: "비전공자가 샘플 주제의 등장 배경과 핵심 원리를 이해하도록 돕습니다.",
  tags: ["Sample", "개론"],
  author: "Snow Choi",
  updated: "2026",
  audience: "관련 분야에 관심이 있지만 전문 배경지식은 없는 일반인",
  prerequisites: [],
  outcomes: ["주제가 등장한 이유를 설명한다."],
  sections: [
    { role: "problem", title: "무엇이 문제였을까?", blocks: [{ id: "sample-problem", type: "paragraph", summary: "해결할 문제를 정의합니다." }] },
    { role: "prior-art", title: "이전에는 어떻게 했을까?", blocks: [{ id: "sample-prior", type: "paragraph", summary: "기존 접근을 설명합니다." }] },
    { role: "method", title: "핵심 원리는 무엇일까?", blocks: [{ id: "sample-method", type: "paragraph", summary: "현재 방법의 원리를 설명합니다." }] },
    { role: "cases", title: "어디에 쓰일까?", blocks: [{ id: "sample-cases", type: "paragraph", summary: "대표 사례를 연결합니다." }] },
    { role: "conclusion", title: "무엇을 기억해야 할까?", blocks: [{ id: "sample-conclusion", type: "paragraph", summary: "결론과 한계를 정리합니다." }] },
  ],
  presentation: {
    slides: [
      { id: "cover", type: "cover" },
      { id: "agenda", type: "agenda" },
      { id: "problem", type: "content", sectionRole: "problem", category: "문제의 정의", title: "무엇이 문제였을까?", layout: "stack", blockIds: ["sample-problem"] },
      { id: "prior", type: "content", sectionRole: "prior-art", category: "기존 접근", title: "이전에는 어떻게 했을까?", layout: "stack", blockIds: ["sample-prior"] },
      { id: "method", type: "content", sectionRole: "method", category: "핵심 방법론", title: "핵심 원리는 무엇일까?", layout: "stack", blockIds: ["sample-method"] },
      { id: "cases", type: "content", sectionRole: "cases", category: "활용 사례", title: "어디에 쓰일까?", layout: "stack", blockIds: ["sample-cases"] },
      { id: "conclusion", type: "content", sectionRole: "conclusion", category: "결론과 한계", title: "무엇을 기억해야 할까?", layout: "stack", blockIds: ["sample-conclusion"] },
      { id: "outro", type: "outro", title: "Q & A", description: "질문을 받아 함께 정리합니다." },
    ],
  },
}
```

Supported block contracts:

```js
{ id, type: "heading", text, level: 3 }
{ id, type: "paragraph", summary, detail: "optional reading-only depth" }
{ id, type: "list", items: ["first", "second"] }
{ id, type: "code", code, language: "python", caption: "optional" }
{ id, type: "quote", text, attribution: "optional", source: "optional" }
{ id, type: "summary", items: ["first", "second"] }
{ id, type: "image", src: "/features/seminars/assets/python-intro/example.webp", alt, decorative: false, caption: "optional", owned: true }
{ id, type: "image", src: "/features/seminars/assets/python-intro/example.webp", alt, decorative: false, caption: "optional", owned: false, credit }
```

An image path is origin-rooted and must stay under `/features/seminars/assets/<topic-id>/`. An image must have either a non-empty `alt` or `decorative: true`. A non-owned image must also have a non-empty `credit`. A decorative image uses `alt: ""`.

Supported slide contracts:

```js
{ id, type: "cover" }
{ id, type: "agenda" }
{
  id,
  type: "content",
  sectionRole: "method",
  category: "핵심 방법론",
  title: "파이썬은 무엇을 단순하게 만들까?",
  layout: "stack",
  blockIds: ["python-method-principles"],
}
{ id, type: "outro", title: "Q & A", description: "질문을 받아 함께 정리합니다." }
```

`layout` is either `stack` or `split`. Every semantic section role must be represented by at least one `content` slide, but a slide does not need to reference every detail block from that section.

---

### Task 1: Establish the format contract and feature-local test runner

**Files:**
- Create: `features/seminars/README.md`
- Create: `features/seminars/formats/introductory-60.md`
- Create: `features/seminars/data/validation.js`
- Create: `features/seminars/tests/fixtures.mjs`
- Create: `features/seminars/tests/contract.test.mjs`
- Modify: `package.json`
- Modify: `tests/foundation.test.mjs`
- Modify: `tests/README.md`
- Modify: `docs/history/2026.md`
- Modify if a blocking issue appears: `docs/status.md`

**Interfaces:**
- Produces: `SECTION_ROLES: readonly string[]`
- Produces: `BLOCK_TYPES: readonly string[]`
- Produces: `validateSeminar(topic: object): object`, returning the same object or throwing `TypeError("세미나 <id>: <field error>")`
- Produces: `createValidSeminar(overrides?: object): object` for feature-local tests only

- [ ] **Step 1: Add feature-local test discovery and write the failing contract tests**

Change the test script and its metadata assertion to the exact value below:

```json
"test": "node --test tests/*.test.mjs features/seminars/tests/*.test.mjs"
```

Create `fixtures.mjs` with five roles, one paragraph block per role, and five matching content slides. In `contract.test.mjs`, assert that:

```js
assert.equal(validateSeminar(validTopic), validTopic);
assert.throws(
  () => validateSeminar(createValidSeminar({ sections: validTopic.sections.slice(0, 4) })),
  /sections.*problem.*prior-art.*method.*cases.*conclusion/,
);
assert.throws(() => validateSeminar(topicWithDuplicateBlockIds), /duplicate block id/);
assert.throws(() => validateSeminar(topicWithMissingBlockReference), /missing block reference/);
assert.throws(() => validateSeminar(topicWithUnlabelledImage), /image.*alt.*decorative/);
assert.throws(() => validateSeminar(topicWithUncreditedRemoteImage), /image.*credit/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/contract.test.mjs
```

Expected: FAIL because `features/seminars/data/validation.js` does not exist.

- [ ] **Step 3: Implement the validator with deterministic field paths**

Use these exact role and block constants:

```js
export const SECTION_ROLES = Object.freeze([
  "problem",
  "prior-art",
  "method",
  "cases",
  "conclusion",
]);

export const BLOCK_TYPES = Object.freeze([
  "heading",
  "paragraph",
  "list",
  "code",
  "quote",
  "summary",
  "image",
]);
```

`validateSeminar` must collect all errors and throw once. Validate non-empty `id`, `format`, `title`, `subtitle`, `summary`, `author`, `updated`, `audience`; non-empty `outcomes`; array `tags` and `prerequisites`; exact `introductory-60` format; exact five roles in order; unique non-empty block IDs; supported block types and their required fields; slide types; `stack|split` layouts; unique slide IDs; existing block references; and coverage of all five roles by content slides. Return the original topic when the error list is empty.

Apply these exact block rules: `heading.text` is non-empty and `level` is 2 or 3; `paragraph.summary`, `code.code`, and `quote.text` are non-empty; `list.items` and `summary.items` are non-empty arrays of non-empty strings; optional text fields are strings when present; `image.src` starts with `/features/seminars/assets/<current-topic-id>/`, `alt` is non-empty unless `decorative === true`, decorative images use `alt === ""`, and `owned === false` requires non-empty `credit`.

Apply these exact slide rules: supported types are `cover`, `agenda`, `content`, and `outro`; every slide has a unique non-empty `id`; content slides require a known `sectionRole`, non-empty `category` and `title`, `stack|split` layout, and at least one block ID owned by the same section; cover and agenda do not accept `blockIds`; outro requires non-empty `title` and `description`.

Build field-aware errors with this final shape:

```js
if (errors.length > 0) {
  const topicId = topic?.id || "<unknown>";
  throw new TypeError(`세미나 ${topicId}: ${errors.join("; ")}`);
}
return topic;
```

- [ ] **Step 4: Document the domain and human-facing format rules**

`features/seminars/README.md` must contain responsibility, the two future public orchestrators, internal directory roles, dependency direction, validation/error lifecycle, test command, URL stability, and the second-consumer rule for global promotion.

`formats/introductory-60.md` must contain the approved audience, the five semantic roles, method-first emphasis, flexible visible headings, common outcomes, no hard time/content budget, shared-source rule, presentation/reading responsibilities, layout and image requirements, and evidence-based evolution rule.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/contract.test.mjs
/Users/snow0821/.local/bin/fnm exec --using=24 npm test
```

Expected: contract tests PASS and the existing 17 repository tests PASS under the expanded test command.

- [ ] **Step 6: Record results and commit**

Record the RED/GREEN evidence and any contract issue in the active history entry, then commit only Task 1 files:

```bash
git add package.json tests/foundation.test.mjs tests/README.md features/seminars/README.md features/seminars/formats/introductory-60.md features/seminars/data/validation.js features/seminars/tests/fixtures.mjs features/seminars/tests/contract.test.mjs docs/history/2026.md docs/status.md
git commit -m "feat: define seminar content contract"
```

### Task 2: Migrate Python and Web to one structured source

**Files:**
- Create: `features/seminars/data/topics/python-intro.js`
- Create: `features/seminars/data/topics/web-intro.js`
- Create: `features/seminars/data/seminars.js`
- Create: `features/seminars/tests/data.test.mjs`
- Modify: `docs/history/2026.md`
- Modify if content remains incomplete: `docs/status.md`

**Interfaces:**
- Produces: `pythonIntroData: Seminar`
- Produces: `webIntroData: Seminar`
- Produces: `getSeminarList(): Seminar[]`
- Produces: `getSeminar(id: string): Seminar | null`

- [ ] **Step 1: Write failing registry and migration tests**

Assert both topics validate, no topic owns the legacy `slides` or `doc` keys, the roles are exact, and every role appears in the presentation plan:

```js
assert.deepEqual(getSeminarList().map(({ id }) => id), ["python-intro", "web-intro"]);
assert.equal(getSeminar("python-intro"), pythonIntroData);
assert.equal(getSeminar("missing"), null);

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
```

Collect every production image block and assert `existsSync(resolve(projectRoot, block.src.slice(1)))`. This repository-level file check complements the browser-safe validator and prevents a valid-looking data path from pointing at a missing asset.

- [ ] **Step 2: Run the data test and verify RED**

Run:

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/data.test.mjs
```

Expected: FAIL because the feature-local topic and registry modules do not exist.

- [ ] **Step 3: Convert the Python topic without copying facts between views**

Keep the existing title, exact legacy subtitle, author, summary, tags, examples, and code. Use this exact semantic map:

| Role | Visible title | Required block IDs |
|---|---|---|
| `problem` | 프로그래밍은 왜 어렵게 느껴질까? | `python-problem-entry-barrier` |
| `prior-art` | 기존 언어는 무엇을 요구했을까? | `python-prior-explicit-machinery` |
| `method` | 파이썬은 무엇을 단순하게 만들까? | `python-method-principles`, `python-method-types`, `python-method-code`, `python-method-control` |
| `cases` | 파이썬은 어디에서 쓰일까? | `python-cases-ecosystem` |
| `conclusion` | 무엇을 기억하고 조심해야 할까? | `python-conclusion-takeaways`, `python-conclusion-limits` |

The problem block explains that expressing repetitive work and data processing as exact instructions has a high entry barrier. The prior-art block explains the trade-off of explicit types and compile/tooling steps in languages such as C and Java without calling those languages inferior. The method blocks preserve dynamic typing, indentation, collections, control flow, functions, and the existing profile code. The cases block covers automation, web, data analysis, and AI. The conclusion adds runtime type errors, performance-sensitive workloads, and ecosystem choice as limits alongside the existing takeaways.

Use nine slides in this order: `cover`, `agenda`, one content slide for `problem`, one for `prior-art`, two for `method`, one for `cases`, one for `conclusion`, `outro`. Method code uses `layout: "split"`; the other content slides use `layout: "stack"`.

- [ ] **Step 4: Convert the Web topic with the same contract**

Keep the existing title, exact legacy subtitle, author, summary, tags, HTML/CSS example, HTTP, client-server, DOM/CSSOM, and browser rendering explanations. Use this semantic map:

| Role | Visible title | Required block IDs |
|---|---|---|
| `problem` | 연결된 컴퓨터만으로 정보 공유가 될까? | `web-problem-common-information-space` |
| `prior-art` | 웹 이전의 방식에는 무엇이 부족했을까? | `web-prior-fragmented-services` |
| `method` | 웹은 어떤 공통 약속으로 동작할까? | `web-method-client-server`, `web-method-trio`, `web-method-code`, `web-method-rendering` |
| `cases` | 웹은 문서를 넘어 어디에 쓰일까? | `web-cases-services` |
| `conclusion` | 열린 웹의 장점과 책임은 무엇일까? | `web-conclusion-takeaways`, `web-conclusion-limits` |

The problem block distinguishes the internet network from a shared information system. The prior-art block describes fragmented transfer tools and proprietary document conventions without making an unsupported claim of total replacement. The method blocks preserve URL/DNS/HTTP, client-server, HTML/CSS/JavaScript, DOM/CSSOM, layout and paint. The cases block covers publishing, interactive applications, and APIs. The conclusion preserves standards and accessibility while adding security, performance, compatibility, and ecosystem complexity as limits.

Use the same nine-slide pattern and use `layout: "split"` for the HTML/CSS code slide.

- [ ] **Step 5: Build the lazy-validated registry accessors**

Do not validate during ES module evaluation: an import-time exception would prevent the page orchestrator from rendering the required user-facing error state. Validate when a consumer requests the list or one topic:

```js
const topics = Object.freeze([pythonIntroData, webIntroData]);
const seminarsDatabase = Object.freeze(
  Object.fromEntries(topics.map((topic) => [topic.id, topic])),
);

export function getSeminarList() {
  return topics.map(validateSeminar);
}

export function getSeminar(id) {
  const topic = seminarsDatabase[id];
  return topic ? validateSeminar(topic) : null;
}
```

- [ ] **Step 6: Run contract, data, and full tests**

Run:

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/contract.test.mjs features/seminars/tests/data.test.mjs
/Users/snow0821/.local/bin/fnm exec --using=24 npm test
```

Expected: both feature tests PASS; existing pages continue using the old registry and remain green during this temporary coexistence.

- [ ] **Step 7: Record results and commit**

```bash
git add features/seminars/data features/seminars/tests/data.test.mjs docs/history/2026.md docs/status.md
git commit -m "content: migrate introductory seminars"
```

### Task 3: Render both layouts from semantic blocks

**Files:**
- Create: `features/seminars/components/content-block.js`
- Create: `features/seminars/layouts/reading-document.js`
- Create: `features/seminars/layouts/presentation-slides.js`
- Create: `features/seminars/layouts/overflow.js`
- Create: `features/seminars/tests/layouts.test.mjs`
- Modify: `docs/history/2026.md`
- Modify if layout validation is blocked: `docs/status.md`

**Interfaces:**
- Produces: `renderContentBlock(block, { view: "reading" | "presentation" }): string`
- Produces: `renderReadingDocument(container, topicData): void`
- Produces: `renderPresentationSlides(container, topicData, { seminarsHref?: string }): void`
- Produces: `findLayoutOverflow(root): Array<{ id: string, horizontal: boolean, vertical: boolean }>`
- Produces: `inspectLayoutAfterRender(root, { documentRef, windowRef }): Promise<Array<{ id: string, horizontal: boolean, vertical: boolean }>>`
- Consumes: the validated `Seminar`, block, and slide contracts from Tasks 1–2

- [ ] **Step 1: Write failing shared-source rendering tests**

Use a container with an `innerHTML` property. Assert that reading markup contains all five `data-section-role` values, paragraph `summary` and `detail`, code markup and image metadata. Assert that presentation markup contains only referenced blocks, uses the paragraph `summary` but not `detail`, derives the agenda from section titles, and emits one `[data-layout-boundary]` per slide.

```js
renderReadingDocument(readingContainer, topic);
assert.match(readingContainer.innerHTML, /data-section-role="problem"/);
assert.match(readingContainer.innerHTML, /reading-only detail/);

renderPresentationSlides(slideContainer, topic, { seminarsHref: "../seminars/" });
assert.match(slideContainer.innerHTML, /shared key point/);
assert.doesNotMatch(slideContainer.innerHTML, /reading-only detail/);
assert.match(slideContainer.innerHTML, /data-layout-boundary/);
```

For `findLayoutOverflow`, provide two fake boundaries: one with equal scroll/client dimensions and one with `scrollHeight` two pixels larger. Assert only the second is returned with `vertical: true`.

For `inspectLayoutAfterRender`, assert that a pending image delays inspection until its load or error signal settles, while an already complete image does not delay the result.

- [ ] **Step 2: Run the layout test and verify RED**

Run:

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/layouts.test.mjs
```

Expected: FAIL because the block and layout modules do not exist.

- [ ] **Step 3: Implement safe semantic block rendering**

Import `escapeHtml` and `escapeAttribute` from `../../../utils/html.js`. Render every user-visible string through the appropriate helper. Reading paragraphs render both `summary` and optional `detail`; presentation paragraphs render only `summary`. Lists, code, quotes, summaries, headings, and images render the same source data with view-specific wrapper classes. Images use `alt=""` only when `decorative` is true and include figcaption/credit only when present.

Use `content-block content-block--<type>` on every root block. Use `content-block--detail` for paragraph detail, `content-block--caption` for a code/image caption, and `content-block--credit` for image credit. The layout renderers wrap referenced blocks with `slide-blocks slide-blocks--<layout>` or `reading-blocks`; these names are the CSS contract for Task 6.

Reject unsupported types even though validated production data should not reach that branch:

```js
export function renderContentBlock(block, { view = "reading" } = {}) {
  switch (block.type) {
    case "heading": return renderHeading(block);
    case "paragraph": return renderParagraph(block, view);
    case "list": return renderList(block);
    case "code": return renderCode(block);
    case "quote": return renderQuote(block);
    case "summary": return renderSummary(block);
    case "image": return renderImage(block);
    default:
      throw new TypeError(`지원하지 않는 세미나 블록: ${block.type}`);
  }
}
```

Define those seven render helpers as private functions in the same file and keep the file below 200 lines.

- [ ] **Step 4: Implement reading and presentation projection**

Build a private `Map` of block IDs for the presentation renderer. `cover` derives title/subtitle/summary/author/updated from metadata. `agenda` derives its items from the five section titles. A `content` slide resolves only its `blockIds` and adds `data-section-role` and `data-layout-boundary`. `outro` uses only its own non-factual closing copy and the supplied seminar-list link.

The reading renderer outputs the topic metadata, audience, prerequisites, outcomes, then all section blocks in source order. Neither renderer mutates topic data.

- [ ] **Step 5: Implement DOM overflow inspection without a content budget**

Use a one-pixel tolerance and ignore the intentionally scrolling outer horizontal container:

```js
export function findLayoutOverflow(root) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll("[data-layout-boundary]")].flatMap((element) => {
    const horizontal = element.scrollWidth > element.clientWidth + 1;
    const vertical = element.scrollHeight > element.clientHeight + 1;
    if (!horizontal && !vertical) return [];
    return [{ id: element.dataset.layoutId || "<unknown>", horizontal, vertical }];
  });
}
```

Wait for fonts, all images below the rendered root, and one animation frame before inspecting the real page. An image error must settle the wait rather than blocking inspection; use `decode()` when available for already loaded images and tolerate decode rejection before measuring:

```js
export async function inspectLayoutAfterRender(root, { documentRef, windowRef } = {}) {
  if (documentRef?.fonts?.ready) await documentRef.fonts.ready;
  await waitForImages(root);
  await new Promise((resolve) => {
    if (windowRef?.requestAnimationFrame) windowRef.requestAnimationFrame(resolve);
    else resolve();
  });
  return findLayoutOverflow(root);
}
```

- [ ] **Step 6: Run focused and full tests**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/layouts.test.mjs
/Users/snow0821/.local/bin/fnm exec --using=24 npm test
```

Expected: shared-source and overflow tests PASS; full suite remains green.

- [ ] **Step 7: Record results and commit**

```bash
git add features/seminars/components/content-block.js features/seminars/layouts features/seminars/tests/layouts.test.mjs docs/history/2026.md docs/status.md
git commit -m "feat: render shared seminar content"
```

### Task 4: Move seminar interaction components behind the feature boundary

**Files:**
- Create: `features/seminars/components/seminar-list.js`
- Create: `features/seminars/components/slide-header.js`
- Create: `features/seminars/components/presentation-controller.js`
- Create: `features/seminars/components/error-state.js`
- Create: `features/seminars/tests/seminar-list.test.mjs`
- Create: `features/seminars/tests/presentation-components.test.mjs`
- Modify: `docs/history/2026.md`

**Interfaces:**
- Produces: `renderSeminarList(container, { seminars, paths, onDownload }): void`
- Produces: `createSlideHeaderMarkup(options): string`
- Produces: registered `<slide-header>` and `SlideHeader`
- Produces: `PresentationController(documentRef)`
- Produces: `renderSeminarError(container): void`

- [ ] **Step 1: Write failing component tests in two focused files**

Move the current list rendering and button-state assertions into `seminar-list.test.mjs`. Move the header assertions into `presentation-components.test.mjs`, then add controller tests with a two-slide fake document: ArrowRight advances the counter to `2 / 2`, ArrowLeft returns to `1 / 2`, keys from an element whose `closest("a, button, input, textarea, select")` is truthy do not navigate, and previous/next buttons disable at their boundaries. Change all imports to target `features/seminars/components/`.

Add these error-state assertions to `presentation-components.test.mjs`:

```js
renderSeminarError(container);
assert.match(container.innerHTML, /role="alert"/);
assert.match(container.innerHTML, /자료를 불러올 수 없습니다/);
assert.doesNotMatch(container.innerHTML, /stack|TypeError|undefined/);
```

Retain tests for escaped titles/attributes, unique PDF accessibility names, pending download state, keyboard navigation, focusable-control key suppression, and presentation-only navigation buttons.

- [ ] **Step 2: Run the component test and verify RED**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/seminar-list.test.mjs features/seminars/tests/presentation-components.test.mjs
```

Expected: FAIL because the feature-local component modules do not exist.

- [ ] **Step 3: Copy behavior into feature-owned components and fix imports**

Preserve the current list, header, and controller behavior. Change only imports to reach `../../../utils/html.js`, rename `controller.js` to `presentation-controller.js`, and keep each file under 200 lines. Do not delete the old modules until page consumers move in Task 7.

Implement a generic public error state without exposing internal exception text:

```js
export function renderSeminarError(container) {
  if (!container) return;
  container.innerHTML = `
    <section class="seminar-error" role="alert">
      <h1>자료를 불러올 수 없습니다</h1>
      <p>요청한 세미나 자료를 확인한 뒤 다시 시도해 주세요.</p>
    </section>
  `;
}
```

- [ ] **Step 4: Run focused and full tests**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/seminar-list.test.mjs features/seminars/tests/presentation-components.test.mjs
/Users/snow0821/.local/bin/fnm exec --using=24 npm test
```

Expected: feature components PASS without changing the old page behavior.

- [ ] **Step 5: Record results and commit**

```bash
git add features/seminars/components features/seminars/tests/seminar-list.test.mjs features/seminars/tests/presentation-components.test.mjs docs/history/2026.md
git commit -m "refactor: move seminar UI components"
```

### Task 5: Move PDF and page orchestration into the feature

**Files:**
- Create: `features/seminars/services/pdf/README.md`
- Create: `features/seminars/services/pdf/exporter.js`
- Create: `features/seminars/services/pdf/render-zone.js`
- Create: `features/seminars/seminars-page.js`
- Create: `features/seminars/presentation-page.js`
- Create: `features/seminars/index.js`
- Create: `features/seminars/tests/pdf.test.mjs`
- Create: `features/seminars/tests/pages.test.mjs`
- Modify: `docs/history/2026.md`
- Modify if runtime behavior cannot be preserved: `docs/status.md`

**Interfaces:**
- Produces: `initializeSeminarsPage({ documentRef, windowRef, getTopics?, getTopic? }): { ok: true } | { ok: false, error }`
- Produces: `initializePresentationPage({ documentRef, windowRef, mode, topicId, shouldPrint?, getTopic?, inspectLayout? }): { ok: true, mode, topicData, topicId, shouldPrint } | { ok: false, error }`
- Public `features/seminars/index.js` exports exactly `initializeSeminarsPage` and `initializePresentationPage`
- Keeps PDF interfaces `createPdfRenderZone`, `waitForPdfLayout`, `createPdfOptions`, and `exportSeminarPdf`

- [ ] **Step 1: Write failing PDF and orchestration tests**

Copy the current PDF lifecycle assertions into `features/seminars/tests/pdf.test.mjs` and target the new paths. Preserve the asynchronous fallback cleanup mutation check.

In `pages.test.mjs`, assert the public surface and both runtime outcomes:

```js
assert.deepEqual(Object.keys(publicModule).sort(), [
  "initializePresentationPage",
  "initializeSeminarsPage",
]);

const success = initializePresentationPage({
  documentRef,
  windowRef,
  mode: "vertical",
  topicId: "sample",
  getTopic: () => topic,
});
assert.equal(success.ok, true);

const failure = initializePresentationPage({
  documentRef,
  windowRef,
  mode: "horizontal",
  topicId: "missing",
  getTopic: () => null,
});
assert.equal(failure.ok, false);
assert.match(container.innerHTML, /role="alert"/);
```

Also assert that an omitted topic defaults to `python-intro`, an explicit unknown topic does not silently fall back, a `getTopic` validator exception renders the same error state, `print` schedules one print call, horizontal mode constructs the controller, and layout overflow is reported through `console.error` with the offending boundary IDs. For the list orchestrator, inject `getTopics: () => { throw new TypeError("invalid fixture"); }` and assert `{ ok: false }` plus the generic error markup.

- [ ] **Step 2: Run both tests and verify RED**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/pdf.test.mjs features/seminars/tests/pages.test.mjs
```

Expected: FAIL because the feature PDF and orchestrator modules do not exist.

- [ ] **Step 3: Move the PDF implementation without changing its lifecycle**

Copy the current PDF code into the feature paths. Update only local imports. Preserve A4 orientation, filenames, layout wait, print fallback, async fallback waiting, and `finally` cleanup. Update the feature-local PDF README with the same responsibilities and new paths.

- [ ] **Step 4: Implement list-page orchestration**

Move `createPresentationPath`, `createPrintFallbackUrl`, and the download flow from the current page. Default `getTopics` to `getSeminarList` and wrap initial list resolution/rendering in an error boundary that logs the original exception, renders `renderSeminarError`, and returns `{ ok: false, error }`. A successful list render returns `{ ok: true }`. Use `getSeminar` instead of direct database indexing during download; a missing or invalid topic throws inside the existing `try`, is logged, and produces the existing alert. Keep the render function selection between `renderPresentationSlides` and `renderReadingDocument`.

- [ ] **Step 5: Implement presentation orchestration and its error boundary**

Normalize `mode` to `horizontal|vertical`, default only an omitted topic to `python-intro`, and treat an explicit unknown topic as an error. Configure the header, render the selected layout, construct `PresentationController` only for horizontal mode, and schedule print after 350 ms when requested.

Default the injectable `inspectLayout` option to `inspectLayoutAfterRender`. After rendering, call `inspectLayout(container, { documentRef, windowRef })` and handle its promise. If issues exist, set `container.dataset.layoutStatus = "error"` and log their IDs with this statement; otherwise set it to `"ok"`:

```js
console.error(
  `세미나 레이아웃 overflow: ${issues.map(({ id }) => id).join(", ")}`,
);
```

If inspection itself rejects, set the status to `"error"` and log the error. Do not delete, truncate, or hide content. The initializer's state return remains synchronous; unit tests inject an immediately resolved inspector and await one microtask before checking the status.

Catch resolution/rendering errors, log the original error, call `renderSeminarError(container)`, and return `{ ok: false, error }`. Successful initialization returns `{ ok: true, mode, topicData, topicId, shouldPrint }`.

- [ ] **Step 6: Create the two-export public facade**

`features/seminars/index.js` contains only:

```js
export { initializePresentationPage } from "./presentation-page.js";
export { initializeSeminarsPage } from "./seminars-page.js";
```

- [ ] **Step 7: Run focused and full tests**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/pdf.test.mjs features/seminars/tests/pages.test.mjs
/Users/snow0821/.local/bin/fnm exec --using=24 npm test
```

Expected: new services and orchestrators PASS while current pages still use legacy modules.

- [ ] **Step 8: Record results and commit**

```bash
git add features/seminars/index.js features/seminars/seminars-page.js features/seminars/presentation-page.js features/seminars/services features/seminars/tests/pdf.test.mjs features/seminars/tests/pages.test.mjs docs/history/2026.md docs/status.md
git commit -m "refactor: move seminar orchestration"
```

### Task 6: Move seminar styles and connect the thin pages

**Files:**
- Create: `features/seminars/styles/index.css`
- Create: `features/seminars/styles/seminar-list.css`
- Create: `features/seminars/styles/content-block.css`
- Create: `features/seminars/styles/presentation-header.css`
- Create: `features/seminars/styles/presentation-layout.css`
- Create: `features/seminars/styles/presentation-slide.css`
- Create: `features/seminars/styles/reading-document.css`
- Create: `features/seminars/styles/print.css`
- Modify: `styles/main.css`
- Modify: `styles/print.css`
- Modify: `pages/seminars/index.html`
- Modify: `pages/seminars/page.js`
- Modify: `pages/presentation/horizontal.html`
- Modify: `pages/presentation/vertical.html`
- Modify: `pages/presentation/page.js`
- Create: `features/seminars/tests/structure.test.mjs`
- Delete: `tests/seminars.test.mjs`
- Delete: `tests/presentation.test.mjs`
- Delete: `tests/pdf.test.mjs`
- Modify: `tests/structure.test.mjs`
- Modify: `tests/README.md`
- Modify: `docs/seminar-domain-plan.md`
- Modify: `docs/history/2026.md`

**Interfaces:**
- Consumes: only the two public orchestrators from `features/seminars/index.js`
- Produces: `features/seminars/styles/index.css` as the only seminar CSS entrypoint used by HTML
- Preserves: existing page URLs, DOM mount IDs, body mode attributes, and page-specific CSS

- [ ] **Step 1: Write failing page-boundary and style-entry tests**

Require the list page and both presentation HTML files to load global styles, then the feature entrypoint, then page CSS:

```html
<link rel="stylesheet" href="../../styles/main.css">
<link rel="stylesheet" href="../../features/seminars/styles/index.css">
<link rel="stylesheet" href="./page.css">
```

Require each page JavaScript file to import `../../features/seminars/index.js` and reject `../../features/seminars/` followed by any deeper path. Require `styles/main.css` not to mention `seminar-card` or `components/presentation`, and require the feature CSS entrypoint to import all seven feature implementation files in the order shown in Step 3.

- [ ] **Step 2: Run the structure test and verify RED**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/structure.test.mjs
```

Expected: FAIL because feature styles do not exist and pages still deep-import legacy modules.

- [ ] **Step 3: Move declarations by owner without visual redesign**

Copy the declarations from the current seminar card and four presentation CSS files into the matching feature files. Split seminar-specific print selectors out of global `styles/print.css`; keep global body, `site-header`, and home `.profile` rules there. Put the moved slide header, slide wrapper, horizontal slide, reading document, and seminar-list print rules in feature `print.css`.

Use this exact entrypoint:

```css
@import "./seminar-list.css";
@import "./content-block.css";
@import "./presentation-header.css";
@import "./presentation-layout.css";
@import "./presentation-slide.css";
@import "./reading-document.css";
@import "./print.css";
```

Do not change existing selectors or declaration values except paths and ownership. Add these new rules to `content-block.css`, using existing design tokens:

```css
.content-block {
  min-width: 0;
}

.content-block + .content-block,
.content-block--detail {
  margin-top: 1rem;
}

.content-block--quote {
  margin-inline: 0;
  padding: 1rem 1.25rem;
  border-left: 4px solid var(--color-accent);
  background: var(--color-surface);
}

.content-block--image img {
  display: block;
  max-width: 100%;
  height: auto;
  margin-inline: auto;
}

.content-block--caption,
.content-block--credit {
  margin-top: 0.5rem;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.seminar-error {
  max-width: 48rem;
  margin: 6rem auto;
  padding: 2rem;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: var(--color-surface);
}

```

In `presentation-slide.css`, rename the existing `.slide-split-grid` selectors to `.slide-blocks--split` and preserve their grid declarations and 768px single-column media rule. Keep the existing `.callout-box` styling by applying that additional class to summary blocks in the reading renderer. Remove a moved legacy selector only when `rg` proves the new markup no longer emits it.

- [ ] **Step 4: Reduce page modules to URL parsing and public initialization**

`pages/seminars/page.js` imports `initializeSeminarsPage` and calls it only when `document` and `window` exist.

`pages/presentation/page.js` parses the query and calls the public initializer:

```js
import { initializePresentationPage } from "../../features/seminars/index.js";

if (typeof document !== "undefined" && typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  initializePresentationPage({
    documentRef: document,
    windowRef: window,
    mode: document.body.dataset.presentationMode,
    topicId: params.get("topic"),
    shouldPrint: params.get("print") === "true",
  });
}
```

Add the feature stylesheet link to the list and both presentation HTML files. Keep the CDN PDF script only on the list page.

- [ ] **Step 5: Run structure, feature, and full tests**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test features/seminars/tests/*.test.mjs
/Users/snow0821/.local/bin/fnm exec --using=24 npm test
```

Expected: page and feature tests PASS. The old modules still exist but have no runtime consumers.

Retire the root seminar page, presentation, and PDF tests after their feature
equivalents pass. Remove the root presentation-style cascade assertion because
the feature structure test owns that boundary. Update `tests/README.md` so
root tests cover global architecture/home/API policy and feature-local tests
cover seminar contract, data, layouts, UI, pages, PDF lifecycle, and structure.

- [ ] **Step 6: Record results and commit**

```bash
git add features/seminars/styles features/seminars/tests/structure.test.mjs styles/main.css styles/print.css pages/seminars pages/presentation tests docs/seminar-domain-plan.md docs/history/2026.md
git commit -m "refactor: load seminar feature pages"
```

### Task 7: Remove legacy ownership and enforce the domain boundary

**Files:**
- Delete: `components/seminar-list.js`
- Delete: `components/presentation/README.md`
- Delete: `components/presentation/controller.js`
- Delete: `components/presentation/document-renderer.js`
- Delete: `components/presentation/slide-header.js`
- Delete: `components/presentation/slide-renderer.js`
- Delete: `data/seminars.js`
- Delete: `data/topics/python-intro.js`
- Delete: `data/topics/web-intro.js`
- Delete: `services/pdf/README.md`
- Delete: `services/pdf/exporter.js`
- Delete: `services/pdf/render-zone.js`
- Delete: `styles/components/seminar-card.css`
- Delete: `styles/components/presentation/header.css`
- Delete: `styles/components/presentation/layout.css`
- Delete: `styles/components/presentation/reading-document.css`
- Delete: `styles/components/presentation/slide-card.css`
- Modify: `tests/module-policy.test.mjs`
- Modify: `tests/structure.test.mjs`
- Modify: `features/seminars/tests/structure.test.mjs`
- Modify: `tests/README.md`
- Modify: `features/seminars/README.md`
- Modify: `docs/history/2026.md`
- Modify if any item cannot move: `docs/status.md`

**Interfaces:**
- Preserves: public page URLs and `features/seminars/index.js` exports
- Enforces: no legacy seminar path and no page deep import
- Extends: module size/import scan to `features/`

- [ ] **Step 1: Add failing legacy-removal and boundary assertions**

Move the seminar-specific legacy path and presentation-style assertions out of root `tests/structure.test.mjs` into the feature structure test, then add every deleted path above to its `forbiddenPaths`. Keep the root test's canonical-document, non-seminar legacy, and generic HTML/CSS reference checks. Add `features` to `scanRoots`, but exclude `features/seminars/data/topics/` from line counting because the project policy classifies content data separately from executable modules; still include topic files in local import resolution. Scan page JS sources and assert imports from the feature match only `../../features/seminars/index.js`. Assert the old `data`, `services`, and seminar-specific component/style directories do not exist after removal.

Apply the content-data exception only to line records, not to import checks. Normalize the repository-relative path before both exclusion and reporting; import `sep` from `node:path`:

```js
const records = sourceFiles
  .map((path) => ({
    absolutePath: path,
    relativePath: relative(projectRoot, path).split(sep).join("/"),
  }))
  .filter(({ relativePath }) => !relativePath.startsWith("features/seminars/data/topics/"))
  .map(({ absolutePath, relativePath }) => ({
    path: relativePath,
    lines: countLines(readFileSync(absolutePath, "utf8")),
  }));
```

Update `tests/README.md` to state that root tests cover global architecture/home/API policies and `features/seminars/tests/` covers the seminar contract, data, layouts, UI, pages, and PDF lifecycle.

- [ ] **Step 2: Run structure and module-policy tests and verify RED**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/structure.test.mjs tests/module-policy.test.mjs features/seminars/tests/structure.test.mjs
```

Expected: FAIL with the listed legacy paths still present.

- [ ] **Step 3: Delete only the now-unreferenced legacy files**

Remove the exact delete list. Do not delete global `components/site-header.js`, `components/section-include.js`, `styles/components/site-header.css`, home styles/content, `utils/html.js`, or shared test helpers.

- [ ] **Step 4: Confirm no stale import, CSS import, or Markdown path remains**

Run:

```bash
rg -n "components/(seminar-list|presentation)|data/(seminars|topics)|services/pdf|styles/components/(seminar-card|presentation)" --glob '!docs/history/2026.md' --glob '!docs/seminar-domain-design.md' --glob '!docs/seminar-domain-plan.md'
```

Expected: no matches outside Git diff metadata. If a current README, architecture, convention, decision, or status reference remains, update it to distinguish or use the target feature path; do not rewrite historical entries.

- [ ] **Step 5: Run focused and full tests**

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/structure.test.mjs tests/module-policy.test.mjs features/seminars/tests/structure.test.mjs
/Users/snow0821/.local/bin/fnm exec --using=24 npm test
```

Expected: no missing imports, no file-length violations, no legacy paths, and all global plus feature tests PASS.

- [ ] **Step 6: Record results and commit**

```bash
git add -A components data services styles tests features/seminars/README.md features/seminars/tests/structure.test.mjs docs/history/2026.md docs/status.md
git commit -m "refactor: remove legacy seminar structure"
```

Before committing, inspect `git status --short` and ensure `.vscode/` is not staged. If `git add -A` staged `.vscode/`, unstage only `.vscode/` before committing and leave its files untouched.

### Task 8: Verify browser behavior and normalize permanent documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/conventions.md`
- Modify: `docs/decisions.md`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`
- Modify: `tests/structure.test.mjs`
- Delete: `docs/seminar-domain-design.md`
- Delete: `docs/seminar-domain-plan.md`

**Interfaces:**
- Makes `features/seminars/README.md` and `features/seminars/formats/introductory-60.md` the permanent detailed contracts
- Makes the four current docs describe only the implemented structure and current issues
- Leaves the year history as the complete plan/problem/solution/verification record

- [ ] **Step 1: Start the local server and run the browser matrix**

Run:

```bash
python3 -m http.server 4173
```

Verify these URLs at desktop width and at 390×844:

```text
http://localhost:4173/pages/seminars/
http://localhost:4173/pages/presentation/horizontal.html?topic=python-intro
http://localhost:4173/pages/presentation/vertical.html?topic=python-intro
http://localhost:4173/pages/presentation/horizontal.html?topic=web-intro
http://localhost:4173/pages/presentation/vertical.html?topic=web-intro
http://localhost:4173/pages/presentation/horizontal.html?topic=missing
```

For both topics, confirm five semantic roles appear in both expressions, reading detail is present, slides contain only their referenced blocks, header title/badge/mode link are correct, keyboard and button navigation work, the list has four distinct accessible PDF buttons, and no horizontal page overflow or clipped layout boundary appears. Confirm the unknown topic shows the explicit error state instead of Python fallback. Confirm `data-layout-status="ok"` after layout settles and that console warning/error output is empty on valid topics.

- [ ] **Step 2: Verify PDF and print fallback in the browser**

Trigger vertical and horizontal downloads for one topic. If the CDN engine is unavailable, confirm the matching URL opens with `print=true`, print is invoked, and the page has the correct orientation/content. Record whether direct PDF or fallback was observed; do not claim both were exercised unless both actually ran.

- [ ] **Step 3: Update canonical documentation to the implemented state**

Update README's topic-add workflow to `features/seminars/data/topics/`, the feature registry, contract test, and two browser views. Replace the old architecture tree and ownership sections with the implemented feature tree and public dependency direction. Mark D-010 `적용`. Set `docs/status.md` to no active migration, remove the old duplicated-content issue if the new contract resolves it, and retain only genuinely unresolved external CDN/audit/deployment items.

In `docs/history/2026.md`, preserve the original task list, every discovered issue with its final status and evidence, each RED/GREEN test, the exact browser matrix/results, final commands, commits, and any remaining work.

- [ ] **Step 4: Absorb and remove temporary planning documents**

Confirm every durable rule exists in the feature README, format contract, architecture, conventions, decisions, or status and every execution detail exists in the year history. Then delete `docs/seminar-domain-design.md` and this plan. Keep the structure test's completed-work assertion that rejects `docs/superpowers/`, and add both temporary filenames to `forbiddenPaths` so finished work cannot leave them behind.

- [ ] **Step 5: Run final verification from a clean command boundary**

Run:

```bash
/Users/snow0821/.local/bin/fnm exec --using=24 npm test
git diff --check
git status --short
```

Expected: all tests PASS, `git diff --check` has no output, only intended migration/docs changes are staged or unstaged, and the user's `.vscode/` remains untracked and untouched.

- [ ] **Step 6: Commit final documentation and verification**

```bash
git add README.md docs tests/structure.test.mjs features/seminars/README.md features/seminars/formats/introductory-60.md
git commit -m "docs: complete seminar feature migration"
```

Inspect the commit before reporting completion:

```bash
git show --stat --oneline HEAD
git status --short
```
