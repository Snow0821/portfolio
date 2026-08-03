import assert from "node:assert/strict";
import test from "node:test";

import { createPageDocument, createTopic, withConsoleError } from "./page-helpers.mjs";
import { createPresentationPath, initializeSeminarsPage } from "../seminars-page.js";

test("presentation paths encode the requested topic", () => {
  assert.equal(
    createPresentationPath("horizontal", "web intro&more"),
    "../presentation/horizontal.html?topic=web%20intro%26more",
  );
});

test("seminar initialization needs only its document and topic list", () => {
  const documentRef = createPageDocument();
  const result = initializeSeminarsPage({
    documentRef,
    getTopics: () => [createTopic()],
  });

  assert.deepEqual(result, { ok: true });
  assert.match(documentRef.list.innerHTML, /seminar-card/);
  assert.doesNotMatch(documentRef.list.innerHTML, /PDF|download|print=true/);
});

test("seminar initialization preserves the explicit error state", async () => {
  await withConsoleError(async () => {
    const documentRef = createPageDocument();
    const result = initializeSeminarsPage({
      documentRef,
      getTopics: () => { throw new TypeError("invalid fixture"); },
    });
    assert.equal(result.ok, false);
    assert.match(documentRef.list.innerHTML, /role="alert"/);
  });
});
