import assert from "node:assert/strict";
import test from "node:test";

import { createFakeDocument } from "../../../tests/helpers/fake-dom.mjs";
import { createPdfRenderZone } from "../services/pdf/render-zone.js";
import { createPdfOptions, exportSeminarPdf } from "../services/pdf/exporter.js";

test("PDF feature service creates horizontal cards and always cleans up", async () => {
  const documentRef = createFakeDocument();
  const topicData = { id: "sample", title: "샘플 주제" };
  const renderContent = (target) => {
    for (let index = 0; index < 5; index += 1) {
      const card = documentRef.createElement("section");
      card.className = "slide-card";
      target.appendChild(card);
    }
  };
  const renderZone = createPdfRenderZone({
    documentRef, topicData, mode: "horizontal", renderContent,
  });
  const target = renderZone.querySelector(".slide-container.horizontal");

  assert.ok(target);
  assert.equal(target.querySelectorAll(".slide-card").length, 5);
  assert.equal(target.querySelectorAll(".slide-card")[0].style.breakAfter, "page");

  await assert.rejects(
    exportSeminarPdf({
      documentRef, topicData, mode: "horizontal", renderContent,
      html2pdf: () => { throw new Error("export failed"); },
      waitForLayout: async () => {},
    }),
    /export failed/,
  );
  assert.equal(documentRef.body.children.length, 0);

  let fallbackCalled = false;
  await exportSeminarPdf({
    documentRef, topicData, mode: "vertical", renderContent: () => {},
    html2pdf: undefined, onFallback: () => { fallbackCalled = true; },
    waitForLayout: async () => {},
  });
  assert.equal(fallbackCalled, true);
  assert.equal(documentRef.body.children.length, 0);

  let releaseFallback;
  let markFallbackStarted;
  const fallbackStarted = new Promise((resolve) => { markFallbackStarted = resolve; });
  const pendingFallback = exportSeminarPdf({
    documentRef, topicData, mode: "vertical", renderContent: () => {},
    html2pdf: undefined,
    onFallback: () => {
      markFallbackStarted();
      return new Promise((resolve) => { releaseFallback = resolve; });
    },
    waitForLayout: async () => {},
  });
  await fallbackStarted;
  assert.equal(documentRef.body.children.length, 1);
  releaseFallback();
  await pendingFallback;
  assert.equal(documentRef.body.children.length, 0);

  const options = createPdfOptions(topicData, "horizontal");
  assert.equal(options.filename, "샘플_주제_발표_슬라이드.pdf");
  assert.equal(options.jsPDF.orientation, "landscape");
});
