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

  let finishDownload;
  const pendingButton = createDownloadButton("sample", "horizontal");
  const pendingContainer = {
    innerHTML: "",
    querySelectorAll: () => [pendingButton],
  };
  renderSeminarList(pendingContainer, {
    seminars: [],
    paths: {},
    onDownload: () =>
      new Promise((resolveDownload) => {
        finishDownload = resolveDownload;
      }),
  });

  const pendingClick = pendingButton.click();
  assert.equal(pendingButton.disabled, true);
  assert.equal(pendingButton.classList.contains("loading"), true);
  assert.equal(pendingButton.icon.textContent, "⏳");
  finishDownload();
  await pendingClick;
  assert.equal(pendingButton.disabled, false);
  assert.equal(pendingButton.classList.contains("loading"), false);
  assert.equal(pendingButton.icon.textContent, "📥");
});

function createDownloadButton(topicId, mode) {
  let clickHandler;
  const classes = new Set();
  const icon = { textContent: "📥" };

  return {
    dataset: { topicId, mode },
    disabled: false,
    icon,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    querySelector: (selector) => (selector === ".icon" ? icon : null),
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

test("PDF service creates the real horizontal structure and always cleans up", async () => {
  const servicePath = resolve(root, "services/pdf-exporter.js");
  assert.equal(existsSync(servicePath), true);

  const serviceUrl = pathToFileURL(servicePath);
  const { createPdfRenderZone, exportSeminarPdf } = await import(
    serviceUrl.href
  );
  const documentRef = createFakeDocument();
  const renderContent = (target) => {
    for (let index = 0; index < 5; index += 1) {
      const card = documentRef.createElement("section");
      card.className = "slide-card";
      target.appendChild(card);
    }
  };

  const renderZone = createPdfRenderZone({
    documentRef,
    topicData: { id: "sample", title: "샘플 세미나" },
    mode: "horizontal",
    renderContent,
  });
  const horizontalTarget = renderZone.querySelector(
    ".slide-container.horizontal",
  );

  assert.ok(horizontalTarget);
  assert.equal(horizontalTarget.querySelectorAll(".slide-card").length, 5);
  assert.equal(
    horizontalTarget.querySelectorAll(".slide-card")[0].style.breakAfter,
    "page",
  );

  await assert.rejects(
    exportSeminarPdf({
      documentRef,
      topicData: { id: "sample", title: "샘플 세미나" },
      mode: "horizontal",
      renderContent,
      html2pdf: () => {
        throw new Error("export failed");
      },
      waitForLayout: async () => {},
    }),
    /export failed/,
  );
  assert.equal(documentRef.body.children.length, 0);

  let fallbackCalled = false;
  await exportSeminarPdf({
    documentRef,
    topicData: { id: "sample", title: "샘플 세미나" },
    mode: "vertical",
    renderContent: () => {},
    html2pdf: undefined,
    onFallback: () => {
      fallbackCalled = true;
    },
    waitForLayout: async () => {},
  });
  assert.equal(fallbackCalled, true);
  assert.equal(documentRef.body.children.length, 0);
});

function createFakeDocument() {
  class FakeElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.className = "";
      this.id = "";
      this.parentNode = null;
      this.style = {};
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      this.children = this.children.filter((candidate) => candidate !== child);
      child.parentNode = null;
    }

    remove() {
      this.parentNode?.removeChild(this);
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] ?? null;
    }

    querySelectorAll(selector) {
      const requiredClasses = selector
        .split(".")
        .filter(Boolean)
        .map((name) => name.trim());
      const matches = [];
      const visit = (element) => {
        const classes = element.className.split(/\s+/).filter(Boolean);
        if (requiredClasses.every((name) => classes.includes(name))) {
          matches.push(element);
        }
        element.children.forEach(visit);
      };
      this.children.forEach(visit);
      return matches;
    }
  }

  return {
    body: new FakeElement("body"),
    createElement: (tagName) => new FakeElement(tagName),
  };
}

test("seminar print fallback URL preserves mode and topic", async () => {
  const seminarsPageUrl = pathToFileURL(
    resolve(root, "pages/seminars/page.js"),
  );
  const { createPrintFallbackUrl } = await import(seminarsPageUrl.href);

  assert.equal(
    createPrintFallbackUrl("horizontal", "web-intro"),
    "../presentation/horizontal.html?topic=web-intro&print=true",
  );
});
