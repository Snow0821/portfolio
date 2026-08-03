import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("required development and documentation files exist", () => {
  const requiredFiles = [
    ".node-version",
    ".gitignore",
    "AGENTS.md",
    "README.md",
    "package.json",
    "package-lock.json",
    "api/health.mjs",
    "docs/architecture.md",
    "docs/conventions.md",
    "docs/decisions.md",
    "docs/status.md",
    "docs/history/2026.md",
  ];

  const missingFiles = requiredFiles.filter(
    (path) => !existsSync(resolve(root, path)),
  );

  assert.deepEqual(missingFiles, []);
});

test("project and package metadata agree on Node.js 24", () => {
  const version = readFileSync(resolve(root, ".node-version"), "utf8").trim();
  const packageJson = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  );

  assert.equal(version, "24");
  assert.equal(packageJson.engines.node, "24.x");
  assert.equal(packageJson.scripts.test, "node --test tests/*.mjs");
});

test("health function returns a successful JSON response", async () => {
  const healthUrl = pathToFileURL(resolve(root, "api/health.mjs"));
  const { GET } = await import(healthUrl.href);
  const response = GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("shared home foundation uses the new component and content paths", () => {
  const requiredFiles = [
    "components/site-header.js",
    "content/home/about.html",
    "content/home/research.html",
    "content/home/career.html",
    "content/home/academic.html",
    "styles/main.css",
    "styles/base.css",
    "styles/layouts.css",
    "styles/components/site-header.css",
    "styles/components/content-section.css",
  ];
  const missingFiles = requiredFiles.filter(
    (path) => !existsSync(resolve(root, path)),
  );
  const homePage = readFileSync(resolve(root, "index.html"), "utf8");

  assert.deepEqual(missingFiles, []);
  assert.match(homePage, /\.\/styles\/main\.css/);
  assert.match(homePage, /\.\/components\/site-header\.js/);
  assert.match(homePage, /\.\/content\/home\/about\.html/);
  assert.match(homePage, /\.\/pages\/seminars\//);
});

test("site header markup identifies only the current destination", async () => {
  const headerUrl = pathToFileURL(resolve(root, "components/site-header.js"));
  const { createSiteHeaderMarkup } = await import(headerUrl.href);
  const markup = createSiteHeaderMarkup({
    homeHref: "/",
    seminarsHref: "/pages/seminars/",
    current: "seminars",
  });

  assert.doesNotMatch(markup, /href="\/" aria-current="page"/);
  assert.match(
    markup,
    /href="\/pages\/seminars\/" aria-current="page"/,
  );
});

test("seminar page package and accessible list component are available", async () => {
  const requiredFiles = [
    "pages/seminars/index.html",
    "pages/seminars/page.js",
    "pages/seminars/page.css",
    "components/seminar-list.js",
    "styles/components/seminar-card.css",
  ];
  const missingFiles = requiredFiles.filter(
    (path) => !existsSync(resolve(root, path)),
  );

  assert.deepEqual(missingFiles, []);

  const componentUrl = pathToFileURL(
    resolve(root, "components/seminar-list.js"),
  );
  const { renderSeminarList } = await import(componentUrl.href);
  const callbacks = [];
  const buttons = [
    createDownloadButton("sample", "vertical"),
    createDownloadButton("sample", "horizontal"),
  ];
  const container = {
    innerHTML: "",
    querySelectorAll: () => buttons,
  };

  renderSeminarList(container, {
    seminars: [
      {
        id: "sample",
        title: "샘플 세미나",
        subtitle: "Sample Seminar",
        summary: "컴포넌트 계약 검증용 데이터",
        tags: ["Sample"],
      },
    ],
    paths: {
      vertical: (topicId) => `/read?topic=${topicId}`,
      horizontal: (topicId) => `/slides?topic=${topicId}`,
    },
    onDownload: (payload) => callbacks.push(payload),
  });

  assert.match(container.innerHTML, /href="\/read\?topic=sample"/);
  assert.match(container.innerHTML, /href="\/slides\?topic=sample"/);
  assert.match(
    container.innerHTML,
    /aria-label="샘플 세미나 읽기용 문서 PDF 다운로드"/,
  );
  assert.match(
    container.innerHTML,
    /aria-label="샘플 세미나 발표용 슬라이드 PDF 다운로드"/,
  );

  await buttons[0].click();
  assert.equal(callbacks.length, 1);
  assert.equal(callbacks[0].topicId, "sample");
  assert.equal(callbacks[0].mode, "vertical");
});

function createDownloadButton(topicId, mode) {
  let clickHandler;

  return {
    dataset: { topicId, mode },
    addEventListener: (eventName, handler) => {
      if (eventName === "click") clickHandler = handler;
    },
    click: () => clickHandler({ preventDefault() {} }),
  };
}

test("presentation package resolves modes, topics, and reactive header output", async () => {
  const requiredFiles = [
    "pages/presentation/horizontal.html",
    "pages/presentation/vertical.html",
    "pages/presentation/page.js",
    "pages/presentation/page.css",
    "components/document-renderer.js",
    "components/slide-renderer.js",
    "components/presentation-controller.js",
    "styles/components/presentation.css",
  ];
  const missingFiles = requiredFiles.filter(
    (path) => !existsSync(resolve(root, path)),
  );

  assert.deepEqual(missingFiles, []);

  const horizontalPage = readFileSync(
    resolve(root, "pages/presentation/horizontal.html"),
    "utf8",
  );
  const verticalPage = readFileSync(
    resolve(root, "pages/presentation/vertical.html"),
    "utf8",
  );

  assert.match(horizontalPage, /data-presentation-mode="horizontal"/);
  assert.match(verticalPage, /data-presentation-mode="vertical"/);
  for (const page of [horizontalPage, verticalPage]) {
    assert.match(page, /\.\.\/\.\.\/styles\/main\.css/);
    assert.match(page, /\.\/page\.css/);
    assert.match(page, /\.\/page\.js/);
  }

  const pageModuleUrl = pathToFileURL(
    resolve(root, "pages/presentation/page.js"),
  );
  const { resolvePresentationState } = await import(pageModuleUrl.href);
  const fallbackTopic = { id: "fallback", title: "Fallback" };
  const state = resolvePresentationState({
    database: { fallback: fallbackTopic },
    mode: "vertical",
    search: "?topic=missing&print=true",
  });

  assert.equal(state.topicData, fallbackTopic);
  assert.equal(state.topicId, "fallback");
  assert.equal(state.mode, "vertical");
  assert.equal(state.shouldPrint, true);

  const headerModuleUrl = pathToFileURL(
    resolve(root, "components/slide-header.js"),
  );
  const { SlideHeader, createSlideHeaderMarkup } = await import(
    headerModuleUrl.href
  );
  assert.ok(SlideHeader.observedAttributes.includes("title"));
  assert.ok(SlideHeader.observedAttributes.includes("is-presentation"));

  const readingHeader = createSlideHeaderMarkup({
    title: "Fallback",
    badge: "읽기용 문서",
    altHref: "./horizontal.html?topic=fallback",
    altText: "발표용 슬라이드 ↗",
    isPresentation: false,
  });
  assert.match(readingHeader, /Fallback/);
  assert.match(readingHeader, /horizontal\.html\?topic=fallback/);
  assert.doesNotMatch(readingHeader, /id="next-slide"/);
});
