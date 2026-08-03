import assert from "node:assert/strict";
import test from "node:test";

import { createPageDocument, createTopic, withConsoleError } from "./page-helpers.mjs";
import * as publicModule from "../index.js";

const { initializePresentationPage, initializeSeminarsPage } = publicModule;

test("public facade exposes only the page initializers", () => {
  assert.deepEqual(Object.keys(publicModule).sort(), [
    "initializePresentationPage", "initializeSeminarsPage",
  ]);
});

test("presentation initializer renders a vertical topic and defaults an omitted ID", () => {
  const documentRef = createPageDocument();
  const requestedIds = [];
  const topic = createTopic("python-intro");
  const result = initializePresentationPage({
    documentRef, windowRef: {}, mode: "vertical",
    getTopic: (id) => { requestedIds.push(id); return topic; },
    inspectLayout: async () => [],
  });
  assert.deepEqual(requestedIds, ["python-intro"]);
  assert.deepEqual(result, {
    ok: true, mode: "vertical", topicData: topic, topicId: "python-intro", shouldPrint: false,
  });
  assert.match(documentRef.container.innerHTML, /reading-document/);
  assert.equal(documentRef.header.getAttribute("alt-text"), "발표용 슬라이드 ↗");
});

test("presentation initializer rejects an explicit unknown topic with generic error markup", async () => {
  await withConsoleError(async () => {
    const documentRef = createPageDocument();
    const requestedIds = [];
    const result = initializePresentationPage({
      documentRef, windowRef: {}, mode: "horizontal", topicId: "missing",
      getTopic: (id) => {
        requestedIds.push(id);
        return id === "python-intro" ? createTopic("python-intro") : null;
      },
    });
    assert.equal(result.ok, false);
    assert.deepEqual(requestedIds, ["missing"]);
    assert.match(documentRef.container.innerHTML, /role="alert"/);
  });
});

test("presentation initializer handles a thrown topic validation error", async () => {
  await withConsoleError(async () => {
    const documentRef = createPageDocument();
    const result = initializePresentationPage({
      documentRef, windowRef: {}, mode: "vertical", topicId: "sample",
      getTopic: () => { throw new TypeError("invalid fixture"); },
    });
    assert.equal(result.ok, false);
    assert.match(documentRef.container.innerHTML, /role="alert"/);
  });
});

test("horizontal presentation constructs its controller and schedules one print", () => {
  const documentRef = createPageDocument();
  const timers = [];
  let prints = 0;
  const result = initializePresentationPage({
    documentRef,
    windowRef: { setTimeout: (callback, delay) => timers.push({ callback, delay }), print: () => { prints += 1; } },
    mode: "horizontal", topicId: "sample", shouldPrint: true,
    getTopic: () => createTopic(), inspectLayout: async () => [],
  });
  assert.equal(result.ok, true);
  assert.ok(documentRef.calls.includes(".slide-container.horizontal"));
  assert.deepEqual(timers.map(({ delay }) => delay), [350]);
  timers[0].callback();
  assert.equal(prints, 1);
});

test("invalid or omitted presentation mode preserves horizontal behavior", () => {
  for (const mode of [undefined, "diagonal"]) {
    const documentRef = createPageDocument();
    const result = initializePresentationPage({
      documentRef, windowRef: {}, mode, topicId: "sample", getTopic: () => createTopic(),
      inspectLayout: async () => [],
    });
    assert.equal(result.mode, "horizontal");
    assert.equal(documentRef.header.getAttribute("alt-href"), "./vertical.html?topic=sample");
    assert.equal(documentRef.header.getAttribute("alt-text"), "읽기용 문서 ↗");
  }
});

test("layout inspection records overflow, empty, and rejected outcomes", async () => {
  await withConsoleError(async (errors) => {
    const overflowDocument = createPageDocument();
    initializePresentationPage({
      documentRef: overflowDocument, windowRef: {}, mode: "vertical", topicId: "sample",
      getTopic: () => createTopic(), inspectLayout: async () => [{ id: "cover" }, { id: "agenda" }],
    });
    await Promise.resolve();
    assert.equal(overflowDocument.container.dataset.layoutStatus, "error");
    assert.deepEqual(errors[0], ["세미나 레이아웃 overflow: cover, agenda"]);

    const clearDocument = createPageDocument();
    initializePresentationPage({
      documentRef: clearDocument, windowRef: {}, mode: "vertical", topicId: "sample",
      getTopic: () => createTopic(), inspectLayout: async () => [],
    });
    await Promise.resolve();
    assert.equal(clearDocument.container.dataset.layoutStatus, "ok");

    const rejectedDocument = createPageDocument();
    const failure = new Error("inspection failed");
    initializePresentationPage({
      documentRef: rejectedDocument, windowRef: {}, mode: "vertical", topicId: "sample",
      getTopic: () => createTopic(), inspectLayout: async () => { throw failure; },
    });
    await Promise.resolve();
    assert.equal(rejectedDocument.container.dataset.layoutStatus, "error");
    assert.equal(errors.at(-1)[0], failure);
  });
});

test("seminar list initializer renders and catches injected resolution errors", async () => {
  const documentRef = createPageDocument();
  const success = initializeSeminarsPage({
    documentRef, windowRef: {}, getTopics: () => [createTopic()], getTopic: () => createTopic(),
  });
  assert.deepEqual(success, { ok: true });
  assert.match(documentRef.list.innerHTML, /seminar-card/);

  await withConsoleError(async () => {
    const failedDocument = createPageDocument();
    const failure = initializeSeminarsPage({
      documentRef: failedDocument, windowRef: {},
      getTopics: () => { throw new TypeError("invalid fixture"); },
    });
    assert.equal(failure.ok, false);
    assert.match(failedDocument.list.innerHTML, /role="alert"/);
  });
});
