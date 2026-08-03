import assert from "node:assert/strict";
import test from "node:test";

import {
  createDownloadButton,
  createFakeDocument,
} from "../../../tests/helpers/fake-dom.mjs";
import { createPageDocument, createTopic, withConsoleError } from "./page-helpers.mjs";
import {
  createPresentationPath,
  createPrintFallbackUrl,
  initializeSeminarsPage,
} from "../seminars-page.js";

test("presentation and print paths encode the requested topic", () => {
  assert.equal(
    createPresentationPath("horizontal", "web intro&more"),
    "../presentation/horizontal.html?topic=web%20intro%26more",
  );
  assert.equal(
    createPrintFallbackUrl("vertical", "web-intro"),
    "../presentation/vertical.html?topic=web-intro&print=true",
  );
});

test("opens the vertical print fallback before the download click yields", async () => {
  const documentRef = createPageDocument();
  const pdfDocument = createFakeDocument();
  const button = createDownloadButton("sample", "vertical");
  const opened = [];
  documentRef.body = pdfDocument.body;
  documentRef.createElement = pdfDocument.createElement;
  documentRef.list.querySelectorAll = () => [button];

  initializeSeminarsPage({
    documentRef,
    windowRef: {
      html2pdf: undefined,
      open: (...args) => opened.push(args),
      alert: () => {},
    },
    getTopics: () => [createTopic()],
    getTopic: () => createTopic(),
  });

  const pendingClick = button.click();
  const openedBeforeYield = structuredClone(opened);
  await pendingClick;

  assert.deepEqual(openedBeforeYield, [[
    "../presentation/vertical.html?topic=sample&print=true",
    "_blank",
    "noopener,noreferrer",
  ]]);
  assert.equal(documentRef.body.children.length, 0);
});

test("a missing download topic logs its error and restores the legacy alert", async () => {
  await withConsoleError(async (errors) => {
    const documentRef = createPageDocument();
    const button = createDownloadButton("missing", "vertical");
    const requestedIds = [];
    const alerts = [];
    documentRef.list.querySelectorAll = () => [button];
    initializeSeminarsPage({
      documentRef,
      windowRef: { alert: (message) => alerts.push(message) },
      getTopics: () => [createTopic()],
      getTopic: (id) => { requestedIds.push(id); return null; },
    });
    await button.click();
    assert.deepEqual(requestedIds, ["missing"]);
    assert.equal(errors[0][1].message, "Unknown seminar topic: missing");
    assert.deepEqual(alerts, [
      "PDF 생성 중 오류가 발생했습니다. 자료를 연 뒤 브라우저의 인쇄 기능을 이용해 주세요.",
    ]);
  });
});
