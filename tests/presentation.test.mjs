import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { projectRoot } from "./helpers/files.mjs";

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
    (path) => !existsSync(resolve(projectRoot, path)),
  );
  assert.deepEqual(missingFiles, []);

  const horizontalPage = readFileSync(
    resolve(projectRoot, "pages/presentation/horizontal.html"),
    "utf8",
  );
  const verticalPage = readFileSync(
    resolve(projectRoot, "pages/presentation/vertical.html"),
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
    resolve(projectRoot, "pages/presentation/page.js"),
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
    resolve(projectRoot, "components/slide-header.js"),
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
