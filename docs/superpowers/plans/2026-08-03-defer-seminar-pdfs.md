# Deferred Seminar PDFs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unreliable runtime PDF generation now, expose no broken download controls, and leave an exact manual-PDF handoff contract for later static linking.

**Architecture:** Seminar reading and presentation HTML remain fully functional. Runtime `html2pdf`, render zones, popup/print fallbacks, and PDF control event handlers are deleted. No PDF link is shown until the user supplies four manually reviewed files; their exact names and future static-link workflow live in a feature-owned asset README and current status.

**Tech Stack:** Static HTML/CSS/JavaScript ES modules, Node.js 24.x, Node built-in test runner, no runtime PDF library, no build step.

## Global Constraints

- Keep runtime build-free and static; add no framework, bundler, Docker, runtime CDN, Vercel Function, or headless-browser generator.
- Do not leave a link to a missing PDF or a control that opens a print/popup fallback.
- Preserve both HTML views and all semantic seminar content.
- Reserve these exact future filenames:
  - `python-intro-reading.pdf`
  - `python-intro-slides.pdf`
  - `web-intro-reading.pdf`
  - `web-intro-slides.pdf`
- Keep every executable JavaScript, CSS, and test file at or below 200 lines.
- Update canonical docs and `docs/history/2026.md` in every task.
- Remove this plan after durable guidance is absorbed.

---

### Task 1: Retire runtime PDF behavior and defer download controls

**Files:**
- Create: `features/seminars/assets/pdf/README.md`
- Modify: `features/seminars/components/seminar-list.js`
- Modify: `features/seminars/seminars-page.js`
- Modify: `features/seminars/presentation-page.js`
- Modify: `features/seminars/README.md`
- Modify: `features/seminars/styles/seminar-list.css`
- Modify: `features/seminars/tests/seminar-list.test.mjs`
- Modify: `features/seminars/tests/seminars-page.test.mjs`
- Modify: `features/seminars/tests/pages.test.mjs`
- Modify: `features/seminars/tests/structure.test.mjs`
- Modify: `pages/seminars/index.html`
- Modify: `pages/presentation/page.js`
- Delete: `features/seminars/services/pdf/README.md`
- Delete: `features/seminars/services/pdf/exporter.js`
- Delete: `features/seminars/services/pdf/render-zone.js`
- Delete: `features/seminars/tests/pdf.test.mjs`
- Modify: `docs/architecture.md`
- Modify: `docs/conventions.md`
- Modify: `docs/decisions.md`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`

**Interfaces:**
- Consumes: registered seminar summaries and the existing reading/presentation paths.
- Produces: pure seminar-card markup with only the two HTML-view links; presentation initialization without `shouldPrint`; a permanent manual asset naming/handoff contract.

- [ ] **Step 1: Write failing retirement tests**

Update list tests to require no PDF control markup or download callback:

```js
assert.doesNotMatch(container.innerHTML, /btn-icon-download|PDF 다운로드|data-topic-id|data-mode/);
assert.match(container.innerHTML, /읽기용 문서/);
assert.match(container.innerHTML, /발표용 슬라이드/);
```

Update page/structure tests to require:

- `initializeSeminarsPage` takes only `documentRef` and `getTopics`.
- `presentation-page.js` exposes no `shouldPrint`, timer, or `windowRef.print`.
- `pages/seminars/index.html` contains no `html2pdf` script.
- `pages/presentation/page.js` does not parse `print`.
- `features/seminars/services/pdf` and `features/seminars/tests/pdf.test.mjs` do not exist.
- No active source references `html2pdf`, `print=true`, `createPrintFallbackUrl`, `exportSeminarPdf`, or `pdf-temp-render-zone`.

- [ ] **Step 2: Run RED**

Run:

```powershell
node --test features/seminars/tests/seminar-list.test.mjs features/seminars/tests/seminars-page.test.mjs features/seminars/tests/pages.test.mjs features/seminars/tests/structure.test.mjs
```

Expected: failures identify existing PDF controls/handlers, print scheduling, CDN markup, and service files.

- [ ] **Step 3: Make seminar-list rendering pure**

Delete both PDF icon controls from each card. Keep the existing reading and presentation anchors, titles, tags, summary, escaping, and target security attributes. Remove all PDF control loops, direct-export predicates, navigation callbacks, loading guards, ARIA mutation, and Space handling.

- [ ] **Step 4: Simplify seminar page orchestration**

Keep `createPresentationPath`. Delete `createPrintFallbackUrl`, PDF imports, mode render selection, and download handler creation. `initializeSeminarsPage({ documentRef, getTopics })` only renders the list and preserves the existing explicit error state.

- [ ] **Step 5: Remove print/CDN runtime behavior**

Delete the deferred CDN script from the seminar list HTML. Remove `shouldPrint`, the 350ms timer, and `windowRef.print()` from presentation initialization. Stop parsing the `print` query. Keep feature print CSS because manual browser printing remains a user action on the visible reading/presentation pages.

- [ ] **Step 6: Delete obsolete runtime PDF services**

Delete the three service files and focused PDF service test. Remove dead download/loading CSS selectors. Strengthen structure tests so the runtime service owner and stale runtime terms cannot return.

- [ ] **Step 7: Add the manual handoff contract**

`features/seminars/assets/pdf/README.md` must state:

- the four exact filenames from Global Constraints;
- PDFs are manually printed and visually reviewed by the user;
- no download link is published while its file is absent;
- a later task adds ordinary `<a download>` links only after file existence, PDF signature, and browser download checks pass;
- reading files are portrait and slide files are landscape.

- [ ] **Step 8: Update canonical docs**

Architecture removes runtime PDF services and records the reserved feature asset location. Conventions require no missing-file download links and manual PDF visual review before publishing. Decision D-010 records the semantic source/two HTML projections and explicitly defers PDF artifacts. Status lists the four-file manual handoff as pending and removes the CDN/popup issue because the runtime path is gone. History records the user's direction change and abandoned generator attempt.

- [ ] **Step 9: Run GREEN**

Run:

```powershell
node --test features/seminars/tests/seminar-list.test.mjs features/seminars/tests/seminars-page.test.mjs features/seminars/tests/pages.test.mjs features/seminars/tests/structure.test.mjs
npm.cmd test
git diff --check
```

Expected: focused tests pass; the full suite has only the already-known temporary `docs/superpowers` structure failure until Task 2 removes this plan; stale runtime PDF search is empty outside history/temporary plans.

- [ ] **Step 10: Browser-verify the deferred state**

At 1440x900 and 390x844, require two cards, two HTML-view links per card, zero PDF/download controls, no overflow/clipping, and no console warning/error. Recheck one reading and one presentation view to confirm PDF retirement did not alter content, layout status, or navigation.

- [ ] **Step 11: Record and commit**

Record exact RED/GREEN, deleted files, browser matrix, line counts, and the four pending manual filenames in history. Commit:

```text
refactor: defer seminar PDF downloads
```

---

### Task 2: Complete permanent documentation and remove temporary plans

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
- Delete: `docs/superpowers/plans/2026-08-03-defer-seminar-pdfs.md`

**Interfaces:**
- Consumes: completed seminar feature, runtime PDF retirement, browser evidence, and manual asset contract.
- Produces: canonical documentation with no temporary design/plan files.

- [ ] **Step 1: Add the failing temporary-document boundary**

Require `docs/seminar-domain-design.md`, `docs/seminar-domain-plan.md`, and `docs/superpowers` not to exist.

- [ ] **Step 2: Run RED**

Run `node --test tests/structure.test.mjs`.

Expected: failure lists the temporary documents that still exist.

- [ ] **Step 3: Absorb durable guidance**

README explains topic addition and both HTML views, and states PDF downloads appear only after reviewed static files are supplied. Architecture shows the feature boundary and reserved asset directory. Conventions retain the manual PDF publication gate. D-010 becomes `적용`. Status says migration is complete while the four manual PDFs remain a named pending follow-up.

- [ ] **Step 4: Complete annual history**

Preserve the initial task list, interruption audit, semantic migration, direction corrections, popup failures, abandoned automatic generator attempt, user's manual-PDF decision, final tests/browser evidence, commits, and remaining four-file handoff.

- [ ] **Step 5: Delete temporary documents**

Delete both migration docs and this plan only after every durable rule has a canonical home. Preserve feature READMEs, the format contract, and the asset handoff README.

- [ ] **Step 6: Run final verification**

Run:

```powershell
npm.cmd test
git diff --check
git status --short
```

Expected: all tests pass, temporary docs are absent, no whitespace errors, and only intended final-doc changes remain.

- [ ] **Step 7: Commit**

Commit `docs: complete seminar feature migration`, then inspect `git show --stat --oneline HEAD` and clean status.
