import assert from "node:assert/strict";
import test from "node:test";

import { createDownloadButton } from "../../../tests/helpers/fake-dom.mjs";
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

test("renders and preserves the native vertical print fallback without the CDN", async () => {
  const documentRef = createPageDocument();
  const button = createDownloadButton("sample", "vertical");
  const opened = [];
  const requestedIds = [];
  documentRef.list.querySelectorAll = () => [button];

  initializeSeminarsPage({
    documentRef,
    windowRef: {
      html2pdf: undefined,
      open: (...args) => opened.push(args),
      alert: () => {},
    },
    getTopics: () => [createTopic()],
    getTopic: (id) => { requestedIds.push(id); return createTopic(id); },
  });

  await button.click();

  assert.match(
    documentRef.list.innerHTML,
    /href="\.\.\/presentation\/vertical\.html\?topic=sample&amp;print=true" target="_blank" rel="noopener noreferrer" role="button"/,
  );
  assert.deepEqual(requestedIds, []);
  assert.deepEqual(opened, []);
  assert.equal(button.disabled, false);
});

test("a missing download topic logs its error and restores the legacy alert", async () => {
  await withConsoleError(async (errors) => {
    const documentRef = createPageDocument();
    const button = createDownloadButton("missing", "vertical");
    const requestedIds = [];
    const alerts = [];
    const attributes = new Map();
    button.setAttribute = (name, value) => attributes.set(name, value);
    button.removeAttribute = (name) => attributes.delete(name);
    button.getAttribute = (name) => attributes.get(name) ?? null;
    documentRef.list.querySelectorAll = () => [button];
    initializeSeminarsPage({
      documentRef,
      windowRef: {
        html2pdf: () => {},
        alert: (message) => alerts.push(message),
      },
      getTopics: () => [createTopic()],
      getTopic: (id) => { requestedIds.push(id); return null; },
    });
    await button.click();
    assert.deepEqual(requestedIds, ["missing"]);
    assert.equal(button.getAttribute("aria-disabled"), null);
    assert.equal(errors[0][1].message, "Unknown seminar topic: missing");
    assert.deepEqual(alerts, [
      "PDF 생성 중 오류가 발생했습니다. 자료를 연 뒤 브라우저의 인쇄 기능을 이용해 주세요.",
    ]);
  });
});
