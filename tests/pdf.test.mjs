import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { createFakeDocument } from "./helpers/fake-dom.mjs";
import { projectRoot } from "./helpers/files.mjs";

test("PDF service creates the real horizontal structure and always cleans up", async () => {
  const requiredFiles = [
    "services/pdf/README.md",
    "services/pdf/exporter.js",
    "services/pdf/render-zone.js",
  ];
  const missingFiles = requiredFiles.filter(
    (path) => !existsSync(resolve(projectRoot, path)),
  );
  assert.deepEqual(missingFiles, []);

  const renderZoneUrl = pathToFileURL(
    resolve(projectRoot, "services/pdf/render-zone.js"),
  );
  const exporterUrl = pathToFileURL(
    resolve(projectRoot, "services/pdf/exporter.js"),
  );
  const { createPdfRenderZone } = await import(renderZoneUrl.href);
  const { createPdfOptions, exportSeminarPdf } = await import(
    exporterUrl.href
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

  let releaseFallback;
  let markFallbackStarted;
  const fallbackStarted = new Promise((resolveStarted) => {
    markFallbackStarted = resolveStarted;
  });
  const pendingFallback = exportSeminarPdf({
    documentRef,
    topicData: { id: "sample", title: "샘플 세미나" },
    mode: "vertical",
    renderContent: () => {},
    html2pdf: undefined,
    onFallback: () => {
      markFallbackStarted();
      return new Promise((resolveFallback) => {
        releaseFallback = resolveFallback;
      });
    },
    waitForLayout: async () => {},
  });
  await fallbackStarted;
  assert.equal(documentRef.body.children.length, 1);
  releaseFallback();
  await pendingFallback;
  assert.equal(documentRef.body.children.length, 0);

  const options = createPdfOptions({ title: "샘플 세미나" }, "horizontal");
  assert.equal(options.filename, "샘플_세미나_발표슬라이드.pdf");
  assert.equal(options.jsPDF.orientation, "landscape");
});
