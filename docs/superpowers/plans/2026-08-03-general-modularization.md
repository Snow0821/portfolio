# General Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve every current URL and user behavior while splitting presentation, PDF, CSS, and test responsibilities into focused modules with automated file-size and reference guards.

**Architecture:** Keep the build-free ES module site and the existing `page → component/service → data` direction. Group presentation and PDF files by feature, centralize HTML escaping in one utility, colocate responsive CSS with its owning component, and split the Node test suite by domain.

**Tech Stack:** Static HTML, CSS, JavaScript ES modules, Node.js 24, Node standard test runner, Python static HTTP server, Chrome browser verification.

## Global Constraints

- The frontend remains build-free static HTML, CSS, and JavaScript ES modules.
- Existing URLs, query parameters, topic fallback, keyboard navigation, PDF export, and print fallback remain unchanged.
- Executable JavaScript, CSS, and test files target 200 lines or fewer; 201–300 lines require a documented exception; more than 300 lines always fails.
- `data/`, `content/`, `docs/`, lockfiles, user configuration, and external dependencies are excluded from the line-count rule.
- Do not modify or stage user-owned `.gitignore`, `.vscode/`, `.env.local`, or `.vercel/` changes.
- Every task updates its problem list and the final task records implementation and verification in `docs/history/2026.md`.
- Use `/Users/snow0821/.local/bin/fnm exec --using=24 npm test` when `npm` is absent from the non-interactive shell `PATH`.

---

## Target File Map

### Create

- `components/presentation/README.md`: presentation contract, dependencies, style ownership, errors, and tests.
- `components/presentation/controller.js`: horizontal slide navigation state and events.
- `components/presentation/document-renderer.js`: reading-document markup.
- `components/presentation/slide-header.js`: reactive `<slide-header>` component.
- `components/presentation/slide-renderer.js`: horizontal slide markup.
- `services/pdf/README.md`: PDF module contract and cleanup guarantee.
- `services/pdf/exporter.js`: export lifecycle, options, filename, engine, and fallback.
- `services/pdf/render-zone.js`: temporary DOM construction, horizontal layout, and layout wait.
- `styles/components/presentation/header.css`: presentation header and navigation.
- `styles/components/presentation/layout.css`: viewer shell and shared content layout.
- `styles/components/presentation/slide-card.css`: slide card variants and content blocks.
- `styles/components/presentation/reading-document.css`: reading-document typography and callouts.
- `tests/README.md`: test domains, helper rules, and commands.
- `tests/helpers/fake-dom.mjs`: download-button and PDF fake DOM factories.
- `tests/helpers/files.mjs`: repository traversal, reference resolution, and line-policy helpers.
- `tests/foundation.test.mjs`: development environment, shared utility, and health contract.
- `tests/home.test.mjs`: home foundation and site-header contract.
- `tests/seminars.test.mjs`: seminars page, list accessibility, and print URL.
- `tests/presentation.test.mjs`: presentation page, header, renderer, and controller.
- `tests/pdf.test.mjs`: render-zone, exporter, cleanup, and fallback.
- `tests/structure.test.mjs`: required modules, legacy absence, local references, and line limits.
- `utils/html.js`: `escapeHtml` and `escapeAttribute`.

### Modify

- `components/site-header.js`: use shared attribute escaping.
- `components/seminar-list.js`: use shared text and attribute escaping.
- `pages/presentation/page.js`: import the presentation feature module.
- `pages/seminars/page.js`: import presentation and PDF feature modules.
- `styles/main.css`: replace the monolithic presentation import with four ordered imports.
- `package.json`: run only root `*.test.mjs` files.
- `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/conventions.md`, `docs/decisions.md`, `docs/status.md`, `docs/history/2026.md`: absorb permanent facts and remove temporary handoff references.

### Remove at the owning task

- `components/document-renderer.js`
- `components/presentation-controller.js`
- `components/slide-header.js`
- `components/slide-renderer.js`
- `services/pdf-exporter.js`
- `styles/components/presentation.css`
- `tests/verify-structure.mjs`
- `docs/superpowers/specs/2026-08-03-general-modularization-design.md`
- `docs/superpowers/specs/2026-08-03-project-modularization-and-seminar-handoff-design.md`
- `docs/superpowers/plans/2026-08-03-general-modularization.md`
- Empty `docs/superpowers/plans/`, `docs/superpowers/specs/`, and `docs/superpowers/` directories.

---

### Task 1: Split the Test Harness by Domain

**Files:**
- Create: `tests/README.md`
- Create: `tests/helpers/fake-dom.mjs`
- Create: `tests/helpers/files.mjs`
- Create: `tests/foundation.test.mjs`
- Create: `tests/home.test.mjs`
- Create: `tests/seminars.test.mjs`
- Create: `tests/presentation.test.mjs`
- Create: `tests/pdf.test.mjs`
- Create: `tests/structure.test.mjs`
- Modify: `package.json`
- Delete: `tests/verify-structure.mjs`

**Interfaces:**
- Produces: `projectRoot: string`, `collectFiles(directory): string[]`, `referenceExists(sourcePath, reference): boolean` from `tests/helpers/files.mjs`.
- Produces: `createDownloadButton(topicId, mode)` and `createFakeDocument()` from `tests/helpers/fake-dom.mjs`.
- Preserves: the current 12 behavior contracts before later path changes.

- [ ] **Step 1: Write the failing package-script assertion**

Create `tests/foundation.test.mjs` with the environment tests from `verify-structure.mjs` and change the script expectation to the target glob:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectRoot } from "./helpers/files.mjs";

test("project and package metadata agree on Node.js 24", () => {
  const version = readFileSync(`${projectRoot}/.node-version`, "utf8").trim();
  const packageJson = JSON.parse(
    readFileSync(`${projectRoot}/package.json`, "utf8"),
  );

  assert.equal(version, "24");
  assert.equal(packageJson.engines.node, "24.x");
  assert.equal(packageJson.scripts.test, "node --test tests/*.test.mjs");
});
```

- [ ] **Step 2: Run the focused test and confirm the expected failure**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/foundation.test.mjs`

Expected: FAIL because `tests/helpers/files.mjs` is absent first; after adding the minimal helper, FAIL because the current script is `node --test tests/*.mjs`.

- [ ] **Step 3: Add the shared test helpers**

Create `tests/helpers/files.mjs` with repository-root and traversal helpers:

```js
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules"].includes(entry.name)) return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}

export function referenceExists(sourcePath, reference) {
  const cleanReference = reference.split(/[?#]/)[0];
  const target = resolve(dirname(sourcePath), cleanReference);
  if (!existsSync(target)) return false;
  return !statSync(target).isDirectory() || existsSync(resolve(target, "index.html"));
}
```

Move the existing `createDownloadButton` and `createFakeDocument` implementations without behavior changes into `tests/helpers/fake-dom.mjs` and export both functions.

- [ ] **Step 4: Move each existing test into its owning domain**

Use this exact mapping and import the shared helpers instead of duplicating them:

```text
foundation.test.mjs  required files, Node metadata, Vercel script, health
home.test.mjs        home foundation, site-header current destination
seminars.test.mjs    seminar list/download state, print fallback URL
presentation.test.mjs presentation modes/topic/header
pdf.test.mjs         render structure, failure cleanup, engine fallback
structure.test.mjs   legacy absence, HTML/CSS local references
```

Create `tests/README.md` with sections `Purpose`, `Test files`, `Helpers`, `Commands`, and `Adding a test`. State that helpers live below `tests/helpers/` and only `tests/*.test.mjs` are direct runner entries.

- [ ] **Step 5: Switch the test command and remove the monolith**

Change `package.json` to:

```json
"test": "node --test tests/*.test.mjs"
```

Delete `tests/verify-structure.mjs` only after every existing test name appears once in the new files.

- [ ] **Step 6: Run the complete test suite**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 npm test`

Expected: PASS with the same 12 contracts and no helper file treated as a test entry.

- [ ] **Step 7: Commit the test split**

```bash
git add package.json tests/README.md tests/helpers tests/*.test.mjs tests/verify-structure.mjs
git commit -m "test: split verification by domain"
```

---

### Task 2: Centralize HTML Escaping

**Files:**
- Create: `utils/html.js`
- Modify: `tests/foundation.test.mjs`
- Modify: `tests/home.test.mjs`
- Modify: `tests/seminars.test.mjs`
- Modify: `tests/presentation.test.mjs`
- Modify: `components/site-header.js`
- Modify: `components/seminar-list.js`
- Modify: `components/document-renderer.js`
- Modify: `components/slide-header.js`
- Modify: `components/slide-renderer.js`

**Interfaces:**
- Produces: `escapeHtml(value): string` escaping `&`, `<`, and `>`.
- Produces: `escapeAttribute(value): string` applying `escapeHtml` and escaping `"`.
- Consumers: every string-template component; data modules remain independent.

- [ ] **Step 1: Write failing utility and integration assertions**

Add to `tests/foundation.test.mjs`:

```js
test("shared HTML utilities separate text and attribute escaping", async () => {
  const { escapeHtml, escapeAttribute } = await import(
    pathToFileURL(resolve(projectRoot, "utils/html.js")).href
  );

  assert.equal(escapeHtml('<Snow & "Web">'), '&lt;Snow &amp; "Web"&gt;');
  assert.equal(
    escapeAttribute('<Snow & "Web">'),
    "&lt;Snow &amp; &quot;Web&quot;&gt;",
  );
});
```

Extend the site-header test with `homeHref: '/?label="home"&mode=<safe>'` and assert the rendered `href` contains `&quot;`, `&amp;`, `&lt;`, and `&gt;`. Keep the existing seminar and slide-header output assertions.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/foundation.test.mjs tests/home.test.mjs`

Expected: FAIL because `utils/html.js` does not exist and site-header does not escape attributes.

- [ ] **Step 3: Add the minimal utility**

Create `utils/html.js`:

```js
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
```

- [ ] **Step 4: Replace component-local escape functions**

Use `escapeAttribute` for `href`, `title`, `data-topic-id`, and `aria-label` attribute values, and `escapeHtml` for text and code values. Imports from current top-level components use:

```js
import { escapeAttribute, escapeHtml } from "../utils/html.js";
```

`document-renderer.js` imports only `escapeHtml`. Remove every component-local `function escapeHtml` and `function escapeAttribute`. Do not change trusted content field structure or add new catch behavior.

- [ ] **Step 5: Verify focused and full behavior**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/foundation.test.mjs tests/home.test.mjs tests/seminars.test.mjs tests/presentation.test.mjs`

Run: `rg -n "^function escape(?:Html|Attribute)" components`

Expected: focused tests PASS and `rg` returns no component-local escape function.

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit the shared utility**

```bash
git add utils/html.js components tests/*.test.mjs
git commit -m "refactor: centralize HTML escaping"
```

---

### Task 3: Group the Presentation Module

**Files:**
- Create: `components/presentation/README.md`
- Move: `components/presentation-controller.js` → `components/presentation/controller.js`
- Move: `components/document-renderer.js` → `components/presentation/document-renderer.js`
- Move: `components/slide-header.js` → `components/presentation/slide-header.js`
- Move: `components/slide-renderer.js` → `components/presentation/slide-renderer.js`
- Modify: `pages/presentation/page.js`
- Modify: `pages/seminars/page.js`
- Modify: `tests/presentation.test.mjs`
- Modify: `tests/seminars.test.mjs`
- Modify: `tests/pdf.test.mjs`
- Modify: `tests/structure.test.mjs`

**Interfaces:**
- Preserves: `PresentationController`, `renderReadingDocument`, `SlideHeader`, `createSlideHeaderMarkup`, and `renderPresentationSlides` signatures.
- Consumes: `escapeHtml` and `escapeAttribute` from `utils/html.js` using `../../utils/html.js`.
- Removes: all four old top-level import paths without compatibility re-export files.

- [ ] **Step 1: Write the failing target-structure assertion**

Add to `tests/presentation.test.mjs`:

```js
const presentationFiles = [
  "components/presentation/README.md",
  "components/presentation/controller.js",
  "components/presentation/document-renderer.js",
  "components/presentation/slide-header.js",
  "components/presentation/slide-renderer.js",
];

assert.deepEqual(
  presentationFiles.filter((path) => !existsSync(resolve(projectRoot, path))),
  [],
);
```

Add the four old component paths to the forbidden path list in `tests/structure.test.mjs`.

- [ ] **Step 2: Run the target test and confirm failure**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/presentation.test.mjs tests/structure.test.mjs`

Expected: FAIL because the presentation directory is absent and the old paths still exist.

- [ ] **Step 3: Relocate the four modules and update utility imports**

Preserve the implementation bodies and change their shared utility imports to:

```js
import { escapeAttribute, escapeHtml } from "../../utils/html.js";
```

`document-renderer.js` continues to import only `escapeHtml`. Do not split slide templates further.

- [ ] **Step 4: Update page and test imports**

Use these exact imports in `pages/presentation/page.js`:

```js
import { PresentationController } from "../../components/presentation/controller.js";
import { renderReadingDocument } from "../../components/presentation/document-renderer.js";
import { renderPresentationSlides } from "../../components/presentation/slide-renderer.js";
import "../../components/presentation/slide-header.js";
```

Use the two renderer paths under `components/presentation/` in `pages/seminars/page.js`. Update test module URLs to the same target paths.

- [ ] **Step 5: Document the presentation contract**

Create `components/presentation/README.md` with sections `Responsibility`, `Public API`, `Lifecycle`, `Dependencies`, `Styles`, `Errors`, `Tests`, and `Extension rules`. State that linked styles live in `styles/components/presentation/`, pages assemble the module, data stays dependency-free, and a new slide type must update renderer tests and layout verification.

- [ ] **Step 6: Run focused and full tests**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/presentation.test.mjs tests/seminars.test.mjs tests/pdf.test.mjs tests/structure.test.mjs`

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 npm test`

Expected: all tests PASS and no old presentation component path exists.

- [ ] **Step 7: Commit the presentation module**

```bash
git add components/presentation components/document-renderer.js components/presentation-controller.js components/slide-header.js components/slide-renderer.js pages tests
git commit -m "refactor: group presentation components"
```

---

### Task 4: Split the PDF Service Lifecycle

**Files:**
- Create: `services/pdf/README.md`
- Create: `services/pdf/render-zone.js`
- Create: `services/pdf/exporter.js`
- Modify: `pages/seminars/page.js`
- Modify: `tests/pdf.test.mjs`
- Modify: `tests/structure.test.mjs`
- Delete: `services/pdf-exporter.js`

**Interfaces:**
- `render-zone.js` produces `createPdfRenderZone(options): HTMLElement` and `waitForPdfLayout(documentRef): Promise<void>`.
- `exporter.js` produces `exportSeminarPdf(options): Promise<void>` and `createPdfOptions(topicData, mode): object`.
- `exportSeminarPdf` consumes `createPdfRenderZone` and defaults `waitForLayout` to `waitForPdfLayout`.

- [ ] **Step 1: Write failing module-boundary and cleanup assertions**

Change `tests/pdf.test.mjs` imports to:

```js
const { createPdfRenderZone } = await import(
  pathToFileURL(resolve(projectRoot, "services/pdf/render-zone.js")).href
);
const { createPdfOptions, exportSeminarPdf } = await import(
  pathToFileURL(resolve(projectRoot, "services/pdf/exporter.js")).href
);
```

Add `services/pdf/README.md`, both module files, and absence of `services/pdf-exporter.js` to the structure assertions. Keep success, intentional exporter failure, engine absence, and cleanup assertions.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/pdf.test.mjs tests/structure.test.mjs`

Expected: FAIL because `services/pdf/` does not exist.

- [ ] **Step 3: Extract render-zone construction**

Move `RENDER_ZONE_ID`, `createPdfRenderZone`, and the layout wait into `services/pdf/render-zone.js`. Export the wait as:

```js
export async function waitForPdfLayout(documentRef) {
  if (documentRef.fonts?.ready) await documentRef.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
```

This file must not reference `html2pdf`, filename options, fallback URLs, alerts, or page modules.

- [ ] **Step 4: Keep export lifecycle ownership in exporter**

Create `services/pdf/exporter.js` starting with:

```js
import { createPdfRenderZone, waitForPdfLayout } from "./render-zone.js";

export async function exportSeminarPdf({
  topicData,
  mode,
  renderContent,
  html2pdf = globalThis.window?.html2pdf,
  onFallback = () => {},
  documentRef = globalThis.document,
  waitForLayout = waitForPdfLayout,
}) {
  let renderZone;

  try {
    renderZone = createPdfRenderZone({ topicData, mode, renderContent, documentRef });
    documentRef.body.appendChild(renderZone);
    await waitForLayout(documentRef);
    if (!html2pdf) {
      await onFallback({ topicData, mode });
      return;
    }
    await html2pdf().set(createPdfOptions(topicData, mode)).from(renderZone).save();
  } finally {
    renderZone?.remove();
  }
}
```

Move `createPdfOptions` unchanged below it. Delete the old combined service.

- [ ] **Step 5: Update the page import and write the module README**

Use:

```js
import { exportSeminarPdf } from "../../services/pdf/exporter.js";
```

Create `services/pdf/README.md` with `Responsibility`, `Public API`, `Lifecycle`, `Fallback`, `Errors`, `Dependencies`, and `Tests`. Explicitly state that exporter owns cleanup on every path and render-zone knows no URL or PDF engine.

- [ ] **Step 6: Verify cleanup and the full suite**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/pdf.test.mjs tests/seminars.test.mjs tests/structure.test.mjs`

Expected: PASS for horizontal cards, page breaks, exporter failure cleanup, engine fallback, and empty body after each export.

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 npm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit the PDF module**

```bash
git add services/pdf services/pdf-exporter.js pages/seminars/page.js tests
git commit -m "refactor: split PDF export lifecycle"
```

---

### Task 5: Split Presentation CSS by Responsibility

**Files:**
- Create: `styles/components/presentation/header.css`
- Create: `styles/components/presentation/layout.css`
- Create: `styles/components/presentation/slide-card.css`
- Create: `styles/components/presentation/reading-document.css`
- Modify: `styles/main.css`
- Modify: `tests/structure.test.mjs`
- Delete: `styles/components/presentation.css`

**Interfaces:**
- Preserves: every existing selector, declaration, token reference, breakpoint, and cascade result.
- Produces: ordered imports `header → layout → slide-card → reading-document`.
- Documented by: `components/presentation/README.md`; no duplicate CSS README.

- [ ] **Step 1: Write the failing CSS-entry assertion**

Add to `tests/structure.test.mjs`:

```js
const presentationStyleImports = [
  '@import "./components/presentation/header.css";',
  '@import "./components/presentation/layout.css";',
  '@import "./components/presentation/slide-card.css";',
  '@import "./components/presentation/reading-document.css";',
];

const mainCss = readFileSync(resolve(projectRoot, "styles/main.css"), "utf8");
let previousIndex = -1;
for (const statement of presentationStyleImports) {
  const currentIndex = mainCss.indexOf(statement);
  assert.ok(currentIndex > previousIndex, `${statement} import order`);
  previousIndex = currentIndex;
}
assert.doesNotMatch(mainCss, /components\/presentation\.css/);
```

Require the four target files and forbid the old monolith.

- [ ] **Step 2: Run the structure test and confirm failure**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/structure.test.mjs`

Expected: FAIL because the four files and imports are absent and the old file exists.

- [ ] **Step 3: Move selectors with their responsive rules**

Copy declarations without changing their text, using this ownership:

```text
header.css            .slide-header through .slide-nav-btn:disabled
layout.css            .slide-wrapper, .slide-container.horizontal,
                      scrollbar, .slide-content-inner
slide-card.css        .slide-card and .slide-cover rules through
                      .slide-card-footer, including code/split-grid rules
reading-document.css  .reading-doc-* and .callout-box rules
```

Split both existing media blocks by selector ownership and place each responsive rule in its owning file. Do not leave an empty media block.

- [ ] **Step 4: Replace the shared CSS import**

Replace the single presentation import in `styles/main.css` with:

```css
@import "./components/presentation/header.css";
@import "./components/presentation/layout.css";
@import "./components/presentation/slide-card.css";
@import "./components/presentation/reading-document.css";
```

Delete `styles/components/presentation.css`.

- [ ] **Step 5: Run structural tests and inspect CSS diffs**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/structure.test.mjs tests/presentation.test.mjs`

Run: `git diff --word-diff=porcelain -- styles/main.css styles/components/presentation.css styles/components/presentation/`

Expected: tests PASS; the diff contains selector relocation and import replacement, not declaration-value changes.

- [ ] **Step 6: Run the full suite and commit**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 npm test`

Expected: all tests PASS.

```bash
git add styles tests/structure.test.mjs
git commit -m "refactor: split presentation styles"
```

---

### Task 6: Enforce File Size and Local Module References

**Files:**
- Modify: `tests/helpers/files.mjs`
- Modify: `tests/structure.test.mjs`
- Modify: `tests/README.md`

**Interfaces:**
- Produces: `countLines(source): number`.
- Produces: `findFileLengthViolations(records, exceptions): string[]`, where each record is `{ path: string, lines: number }`.
- Enforces: no local static/dynamic import points to a missing `.js` or `.mjs` target.

- [ ] **Step 1: Write failing policy unit assertions**

Add to `tests/structure.test.mjs`:

```js
test("file length policy requires review above 200 and rejects above 300", () => {
  const records = [
    { path: "components/ok.js", lines: 200 },
    { path: "components/review.js", lines: 201 },
    { path: "components/too-long.js", lines: 301 },
  ];

  assert.deepEqual(findFileLengthViolations(records, {}), [
    "components/review.js: 201 lines requires a documented exception",
    "components/too-long.js: 301 lines exceeds 300",
  ]);
  assert.deepEqual(
    findFileLengthViolations(records.slice(0, 2), {
      "components/review.js": "single cohesive parser state machine",
    }),
    [],
  );
});
```

Import `findFileLengthViolations` from `./helpers/files.mjs` in the same change.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/structure.test.mjs`

Expected: FAIL because the line-policy helpers are not defined.

- [ ] **Step 3: Add the policy helpers**

Add to `tests/helpers/files.mjs`:

```js
export function countLines(source) {
  if (source === "") return 0;
  const lines = source.split(/\r?\n/).length;
  return source.endsWith("\n") ? lines - 1 : lines;
}

export function findFileLengthViolations(records, exceptions = {}) {
  return records.flatMap(({ path, lines }) => {
    if (lines > 300) return [`${path}: ${lines} lines exceeds 300`];
    if (lines > 200 && !exceptions[path]) {
      return [`${path}: ${lines} lines requires a documented exception`];
    }
    return [];
  });
}
```

- [ ] **Step 4: Scan the actual repository with an empty exception map**

In `tests/structure.test.mjs`, collect `.js`, `.mjs`, and `.css` files only under `api`, `components`, `pages`, `services`, `styles`, `tests`, and `utils`. Read each source, call `countLines`, and assert:

```js
const FILE_SIZE_EXCEPTIONS = {};
assert.deepEqual(findFileLengthViolations(records, FILE_SIZE_EXCEPTIONS), []);
```

Do not scan `data`, `content`, `docs`, `node_modules`, `.vercel`, or user configuration.

- [ ] **Step 5: Extend local-reference validation to ES module imports**

For `.js` and `.mjs`, scan static `from "..."`, side-effect `import "..."`, and dynamic `import("...")` references with these patterns:

```js
const moduleReferencePatterns = [
  /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
];
```

Skip package names and URL schemes; resolve only references starting with `./` or `../`. Append missing targets to the existing `missingReferences` assertion.

- [ ] **Step 6: Document and run the guard**

Add the 200/300 rule, scan roots, exclusions, and exception requirements to `tests/README.md`.

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/structure.test.mjs`

Expected: PASS with `FILE_SIZE_EXCEPTIONS` empty and no missing local import.

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 npm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit the structural guard**

```bash
git add tests/helpers/files.mjs tests/structure.test.mjs tests/README.md
git commit -m "test: enforce module boundaries"
```

---

### Task 7: Normalize Documentation and Run Full Regression

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/conventions.md`
- Modify: `docs/decisions.md`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`
- Modify: `tests/structure.test.mjs`
- Delete: `docs/superpowers/specs/2026-08-03-general-modularization-design.md`
- Delete: `docs/superpowers/specs/2026-08-03-project-modularization-and-seminar-handoff-design.md`
- Delete: `docs/superpowers/plans/2026-08-03-general-modularization.md`

**Interfaces:**
- Produces: canonical handoff through README, AGENTS, four current docs, yearly history, and module READMEs.
- Leaves: seminar authoring system goals and open decisions as the first project task.
- Removes: conversation-specific handoff, completed design spec, completed implementation plan, and temporary links.

- [ ] **Step 1: Write the failing canonical-handoff assertion**

Add to `tests/structure.test.mjs`:

```js
test("completed work leaves only canonical handoff documentation", () => {
  assert.equal(existsSync(resolve(projectRoot, "docs/superpowers")), false);
  const readme = readFileSync(resolve(projectRoot, "README.md"), "utf8");
  assert.doesNotMatch(readme, /superpowers|handoff-design|핸드오프/);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 node --test tests/structure.test.mjs`

Expected: FAIL because temporary specs, this plan, and the README handoff link still exist.

- [ ] **Step 3: Update canonical architecture and conventions**

Update `docs/architecture.md` to the actual presentation, PDF, CSS, tests, and utils tree. Remove `docs/superpowers/` from the current tree. Update dependency direction with `component → utility` and `page → PDF exporter → render zone`.

Update `docs/conventions.md` and `AGENTS.md` so completed temporary plans/specs are absorbed into canonical docs and history, then removed. Keep module README selection criteria and the file-size rule.

Change D-007 in `docs/decisions.md` from `규칙 적용, 자동 검증 예정` to `적용` and record the empty-exception hard guard. Do not create a new per-task ADR.

- [ ] **Step 4: Make status independently handoffable**

Remove resolved general-modularization problems from `docs/status.md`. Add a concise `세미나 작성 시스템 준비` section containing these confirmed goals:

```text
- shared authoring contract and principles
- audience, purpose, key message, overall context, and detailed blocks
- structured local image assets with accessibility metadata
- layout-specific content budgets plus real overflow checks
- slide, reading document, PDF, and print output pipeline
```

Keep these open decisions: shared-source strategy, seminar package structure, block types, exact budgets and severity, image metadata policy, runtime versus generated output, and migration of the two current seminars.

- [ ] **Step 5: Finalize history and remove temporary documents**

In `docs/history/2026.md`, record the initial seven-task plan, every discovered issue with `해결` or `보류`, per-task commits, automatic test counts, browser URLs/viewports, and remaining seminar work.

Remove the README handoff link, both specs, and this plan after its instructions have been applied. Remove empty `docs/superpowers/plans`, `docs/superpowers/specs`, and `docs/superpowers` directories.

- [ ] **Step 6: Run automatic and structural verification**

Run: `/Users/snow0821/.local/bin/fnm exec --using=24 npm test`

Run: `git diff --check`

Run: `find components services styles tests utils -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.css' \) -print0 | xargs -0 wc -l | sort -nr`

Expected: all tests PASS, no whitespace errors, no file above 200 lines, no file-size exception, and no `docs/superpowers/` directory.

- [ ] **Step 7: Run desktop and mobile browser regression**

Start: `python3 -m http.server 4173`

Verify these URLs at desktop and 390×844:

```text
http://localhost:4173/
http://localhost:4173/pages/seminars/
http://localhost:4173/pages/presentation/horizontal.html?topic=python-intro
http://localhost:4173/pages/presentation/vertical.html?topic=python-intro
http://localhost:4173/pages/presentation/horizontal.html?topic=web-intro
http://localhost:4173/pages/presentation/vertical.html?topic=web-intro
```

Check titles, content counts, topic-preserving alternate links, horizontal next-button/ArrowRight/Space navigation, no horizontal overflow, no console error, and usable header/card/document layout. Exercise the PDF fake-DOM cleanup through automated tests; CDN availability is not a blocker because print fallback is the documented behavior.

- [ ] **Step 8: Commit the canonical final state**

Stage only project changes and explicitly exclude `.gitignore`, `.vscode/`, `.env.local`, and `.vercel/`.

```bash
git add AGENTS.md README.md components services styles tests utils pages package.json docs
git commit -m "docs: normalize modular project handoff"
```

Run `git status --short` and confirm only pre-existing user-owned changes remain.
