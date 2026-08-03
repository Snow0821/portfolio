# Static Seminar PDFs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace runtime seminar PDF generation and print-popup fallbacks with four pre-generated, versioned PDF assets exposed as ordinary download links.

**Architecture:** The validated seminar topic source and existing reading/presentation renderers remain authoritative. A development-only Node script starts a loopback server, opens each topic/mode in locally installed Chrome through pinned `puppeteer-core`, waits for `data-layout-status="ok"`, and writes committed PDFs plus a source-hash manifest. Runtime pages only render static `<a download>` links.

**Tech Stack:** Static HTML/CSS/JavaScript ES modules, Node.js 24.x, Node built-in HTTP/test/crypto modules, `puppeteer-core` 25.3.0, installed stable Chrome, Poppler `pdfinfo`/`pdftoppm`.

## Global Constraints

- Keep runtime build-free and static; add no framework, bundler, Docker, runtime CDN, or Vercel Function.
- Pin `puppeteer-core` exactly at `25.3.0`; do not download or bundle another browser.
- Use `SEMINAR_CHROME_PATH` only as an explicit override; otherwise launch the stable Chrome channel.
- Commit outputs under `features/seminars/assets/pdf/`; this user-facing asset location overrides the PDF skill's generic output path.
- Generate `<topic-id>-reading.pdf` and `<topic-id>-slides.pdf` for every registered topic.
- Keep semantic topic data and existing renderers as the only content source.
- Keep every executable JavaScript, CSS, and test file at or below 200 lines.
- Update canonical docs and `docs/history/2026.md` in every task.
- Remove this plan after its durable guidance is absorbed.

---

### Task 1: Add a reproducible generator and asset integrity contract

**Files:**
- Create: `scripts/seminars/README.md`
- Create: `scripts/seminars/pdf-inputs.mjs`
- Create: `scripts/seminars/static-server.mjs`
- Create: `scripts/seminars/generate-pdfs.mjs`
- Create: `features/seminars/tests/static-pdf-assets.test.mjs`
- Create (generated): `features/seminars/assets/pdf/manifest.json`
- Create (generated): `features/seminars/assets/pdf/python-intro-reading.pdf`
- Create (generated): `features/seminars/assets/pdf/python-intro-slides.pdf`
- Create (generated): `features/seminars/assets/pdf/web-intro-reading.pdf`
- Create (generated): `features/seminars/assets/pdf/web-intro-slides.pdf`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `features/seminars/styles/print.css`
- Modify: `docs/conventions.md`
- Modify: `docs/status.md`
- Modify: `docs/history/2026.md`

**Interfaces:**
- Consumes: `getSeminarList()`, presentation URLs, and settled marker `[data-layout-status="ok"]`.
- Produces: `getPdfOutputs(topics)`, `createPdfSourceHash(projectRoot)`, `startStaticServer({ root })`, `npm run pdf:generate`, and manifest `{ version: 1, sourceHash, files }`.

- [ ] **Step 1: Write the failing asset contract test**

Create `static-pdf-assets.test.mjs`. Assert registered topic/mode outputs exactly equal the manifest list, every PDF begins `%PDF-`, every file exceeds 10,000 bytes, and the manifest hash equals a fresh `createPdfSourceHash(projectRoot)`.

```js
test("committed seminar PDFs match every registered topic and current source", async () => {
  const outputs = getPdfOutputs(getSeminarList());
  const manifest = JSON.parse(readFileSync(resolve(pdfRoot, "manifest.json"), "utf8"));
  assert.deepEqual(manifest.files, outputs.map(({ topicId, mode, filename }) => ({
    topicId, mode, filename,
  })));
  assert.equal(manifest.sourceHash, await createPdfSourceHash(projectRoot));
  for (const output of outputs) {
    const bytes = readFileSync(resolve(projectRoot, output.relativePath));
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.ok(bytes.length > 10_000, output.filename);
  }
});
```

- [ ] **Step 2: Run RED**

Run `node --test features/seminars/tests/static-pdf-assets.test.mjs`.

Expected: `ERR_MODULE_NOT_FOUND` for `scripts/seminars/pdf-inputs.mjs` or missing asset/manifest failures.

- [ ] **Step 3: Implement deterministic names and hashing**

In `pdf-inputs.mjs`, preserve registry order and map `vertical -> reading`, `horizontal -> slides`. Hash normalized relative paths plus bytes with SHA-256 from:

```js
const PDF_SOURCE_ROOTS = [
  "features/seminars/components",
  "features/seminars/data",
  "features/seminars/layouts",
  "features/seminars/styles",
  "pages/presentation",
  "scripts/seminars",
  "styles",
  "utils/html.js",
];
```

Recursively include sorted `.js`, `.mjs`, `.css`, and `.html` files. Exclude tests, README/history, generated assets, and the manifest. Return `sha256-<hex>`.

- [ ] **Step 4: Implement the loopback server**

`static-server.mjs` uses `http.createServer`, binds `127.0.0.1` at port `0`, resolves only paths inside the supplied root, serves directory `index.html`, assigns HTML/CSS/JS/JSON/image/font MIME types, and returns an awaited `close()`.

```js
export async function startStaticServer({ root }) {
  const server = createServer((request, response) =>
    serveProjectFile({ request, response, root }));
  await listen(server, { host: "127.0.0.1", port: 0 });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => closeServer(server),
  };
}
```

- [ ] **Step 5: Pin the tool and commands**

Run `npm.cmd install --save-dev --save-exact puppeteer-core@25.3.0`. Add:

```json
"pdf:generate": "node scripts/seminars/generate-pdfs.mjs",
"pdf:verify": "node --test features/seminars/tests/static-pdf-assets.test.mjs"
```

- [ ] **Step 6: Implement generation**

`generate-pdfs.mjs` starts the server, launches Chrome with `{ headless: true, channel: "chrome" }` or the explicit `SEMINAR_CHROME_PATH`, creates the output directory, and generates each output sequentially. Reject console warnings/errors, missing titles, and non-`ok` layout status. Close every page, browser, and server in `finally`.

```js
await page.goto(`${origin}/pages/presentation/${mode}.html?topic=${encodeURIComponent(topicId)}`, {
  waitUntil: "networkidle0",
});
await page.waitForSelector('[data-layout-status="ok"]', { timeout: 10_000 });
await page.emulateMediaType("print");
await page.pdf({
  path: absoluteOutputPath,
  format: "A4",
  landscape: mode === "horizontal",
  printBackground: true,
  preferCSSPageSize: false,
  margin: mode === "horizontal"
    ? { top: 0, right: 0, bottom: 0, left: 0 }
    : { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
});
```

Write `manifest.json` with version, source hash, ordered file entries, and a trailing newline.

- [ ] **Step 7: Make print CSS deterministic**

Retain feature print ownership. Horizontal slides must be landscape page-sized with one slide per page, hidden navigation, and no clipped overflow. Reading content must use portrait margins, allow long sections to continue, and avoid inappropriate block splits. Add no `window.print()` or `print=true` behavior.

- [ ] **Step 8: Generate and capture GREEN**

Run `npm.cmd run pdf:generate` and `npm.cmd run pdf:verify`.

Expected: four stable outputs and one passing asset contract with a current source hash.

- [ ] **Step 9: Inspect PDF structure and visuals**

Load bundled PDF dependencies. Run `pdfinfo` on all four PDFs; require portrait A4 reading pages and landscape A4 slide pages. Render every page with `pdftoppm` into `tmp/pdfs/<asset>/`, inspect all PNGs for clipping, overlap, unexpected blank pages, broken Korean glyphs, missing code, and bad section transitions, then remove `tmp/pdfs/`.

- [ ] **Step 10: Document and commit**

`scripts/seminars/README.md` documents Chrome discovery/override, commands, naming, hashing, failures, and regeneration. Conventions require regeneration after hashed source changes. Status marks assets implemented but runtime links pending. History records RED/GREEN, output names, page sizes/counts, visual QA, and commands.

Run focused test, `npm.cmd test`, `git diff --check`, and line limits. Commit `feat: generate static seminar PDFs`.

---

### Task 2: Replace runtime PDF generation with download links

**Files:**
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
- Consumes: generated naming rules.
- Produces: `createPdfAssetPath(mode, topicId)`, pure list markup with static download links, and presentation initialization without `shouldPrint`.

- [ ] **Step 1: Write failing static-link and retirement tests**

Require `createPdfAssetPath("vertical", "web intro&more")` to return `../../features/seminars/assets/pdf/web%20intro%26more-reading.pdf`. Require `href` plus exact `download` attributes for reading/slides and four unique accessible names. Forbid `data-topic-id`, `data-mode`, `role="button"`, `print=true`, CDN markup, print scheduling, and runtime PDF service files.

- [ ] **Step 2: Run RED**

Run focused list/page/structure tests. Expected failures must cover old print URLs/handlers, `shouldPrint`, CDN script, and still-present PDF service files.

- [ ] **Step 3: Make list rendering pure**

Render ordinary anchors:

```html
<a href="../../features/seminars/assets/pdf/python-intro-reading.pdf"
   download="python-intro-reading.pdf"
   class="btn-icon-download"
   aria-label="파이썬 개론 읽기용 문서 PDF 다운로드">
  <span class="icon" aria-hidden="true">📥</span>
</a>
```

Remove direct-export predicates, navigation callbacks, event listeners, loading/ARIA mutation, and topic/mode data attributes.

- [ ] **Step 4: Simplify the page orchestrator**

Keep `createPresentationPath`. Replace `createPrintFallbackUrl` with encoded `createPdfAssetPath`. `initializeSeminarsPage` takes only `documentRef` and `getTopics`, renders paths, and preserves explicit registry/render error state. Delete renderer/PDF service imports.

- [ ] **Step 5: Remove runtime print/CDN behavior**

Delete the `html2pdf` script. Remove `shouldPrint`, its timer, and `window.print()`; stop parsing the `print` query. Keep layouts, navigation, layout inspection, and print CSS used by the generator.

- [ ] **Step 6: Delete obsolete services and strengthen boundaries**

Delete `features/seminars/services/pdf/` and `features/seminars/tests/pdf.test.mjs`. Forbid runtime `services`, `html2pdf`, `print=true`, `createPrintFallbackUrl`, `exportSeminarPdf`, and `pdf-temp-render-zone` outside history and this temporary plan.

- [ ] **Step 7: Update architecture/decision/status**

Document runtime direction as page -> feature facade -> pure list/layout/data, and generator direction as development tool -> existing pages -> committed assets. Replace the browser-PDF decision with static assets plus regeneration/hash policy. Remove the CDN PDF issue.

- [ ] **Step 8: Run GREEN**

Run focused tests, `npm.cmd run pdf:generate` if the hash changed, `npm.cmd run pdf:verify`, `npm.cmd test`, `git diff --check`, stale-reference search, and line limits.

- [ ] **Step 9: Browser-verify actual downloads**

At 1440x900 and 390x844, require two cards, four unique accessible PDF links, no overflow/clipping, and empty warning/error logs. Trigger Python reading and slide links and require two browser download events without popup, print view, or list navigation. Confirm exact `href` and `download` names.

- [ ] **Step 10: Record and commit**

History records runtime deletions, RED/GREEN, source regeneration, and exact browser downloads. Commit `refactor: serve static seminar PDFs`.

---

### Task 3: Absorb the final direction and retire temporary plans

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
- Delete: `docs/superpowers/plans/2026-08-03-static-seminar-pdfs.md`

**Interfaces:**
- Consumes: completed semantic feature, committed PDFs/manifest, generator commands, and download evidence.
- Produces: canonical documentation with no temporary design/plan files.

- [ ] **Step 1: Add the failing temporary-document assertion**

Require `docs/seminar-domain-design.md`, `docs/seminar-domain-plan.md`, and `docs/superpowers` not to exist.

- [ ] **Step 2: Run RED**

Run `node --test tests/structure.test.mjs`. Expected: failure listing the still-present temporary documents.

- [ ] **Step 3: Absorb durable guidance**

README explains topic addition, PDF regeneration, manifest verification, and both HTML views. Architecture shows feature assets and generator dependency direction. Conventions require regeneration for hashed inputs. D-010 becomes `적용` and records one source, two HTML projections, and PDFs derived from them. Status contains no active migration or CDN/PDF fallback issue.

- [ ] **Step 4: Complete history**

Preserve the initial task list, interruption audit, direction corrections, popup failures, user's static-PDF decision, generator/link RED/GREEN, four assets, page/orientation/render QA, direct download events, final commands/commits, and genuine remaining external work. Clearly distinguish abandoned runtime approaches from final architecture.

- [ ] **Step 5: Delete temporary documents**

Delete both migration docs and this plan only after durable guidance is canonical. Preserve feature/generator READMEs and the format contract.

- [ ] **Step 6: Run final verification**

Run:

```powershell
npm.cmd run pdf:verify
npm.cmd test
git diff --check
git status --short
```

Expected: all tests pass, four PDFs match the source hash, temporary docs are absent, and only intended changes remain.

- [ ] **Step 7: Commit**

Commit `docs: complete seminar feature migration`, then inspect `git show --stat --oneline HEAD` and clean status.
