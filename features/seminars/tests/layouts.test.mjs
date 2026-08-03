import assert from "node:assert/strict";
import test from "node:test";

import { renderReadingDocument } from "../layouts/reading-document.js";
import { renderPresentationSlides } from "../layouts/presentation-slides.js";
import { findLayoutOverflow, inspectLayoutAfterRender } from "../layouts/overflow.js";
import { createValidSeminar } from "./fixtures.mjs";

function createTopic() {
  const topic = createValidSeminar();
  topic.subtitle = "Sample subtitle";
  topic.sections.forEach((section) => { section.title = `agenda ${section.role}`; });
  topic.sections[0].blocks[0].summary = "shared key point <safe>";
  topic.sections[0].blocks[0].detail = "reading-only detail";
  topic.sections[2].blocks.push(
    { id: "sample-code", type: "code", language: "js", caption: "Code <caption>", code: "a < b" },
    { id: "sample-image", type: "image", src: "/image.webp", alt: "Diagram <alt>", caption: "Image caption", credit: "Photo credit" },
  );
  topic.presentation.slides[2].blockIds = ["sample-problem"];
  return topic;
}

function createContainer() {
  return { innerHTML: "" };
}

test("renders all semantic sections and source details for reading", () => {
  const topic = createTopic();
  topic.sections[0].blocks.push({
    id: "sample-summary", type: "summary", items: ["Key point"],
  });
  const container = createContainer();
  renderReadingDocument(container, topic);
  for (const role of ["problem", "prior-art", "method", "cases", "conclusion"]) {
    assert.match(container.innerHTML, new RegExp(`data-section-role="${role}"`));
  }
  assert.match(container.innerHTML, /shared key point &lt;safe&gt;/);
  assert.match(container.innerHTML, /reading-only detail/);
  assert.match(container.innerHTML, /Sample subtitle/);
  assert.match(container.innerHTML, /class="reading-document reading-doc-container"/);
  assert.match(container.innerHTML, /class="reading-document__header reading-doc-header"/);
  assert.match(container.innerHTML, /class="reading-section reading-doc-section"/);
  assert.match(container.innerHTML, /sample/);
  assert.match(container.innerHTML, /<pre><code class="language-js">a &lt; b/);
  assert.match(container.innerHTML, /src="\/image\.webp" alt="Diagram &lt;alt&gt;"/);
  assert.match(container.innerHTML, /content-block--credit/);
  assert.match(container.innerHTML, /content-block--summary callout-box/);
});

test("projects only referenced summaries into bounded presentation slides", () => {
  const topic = createTopic();
  const container = createContainer();
  renderPresentationSlides(container, topic, { seminarsHref: "../seminars/?q=<&" });
  assert.match(container.innerHTML, /shared key point &lt;safe&gt;/);
  assert.match(container.innerHTML, /Sample subtitle/);
  assert.match(container.innerHTML, /class="slide-content-inner"/);
  assert.match(container.innerHTML, /class="slide-card-header"/);
  assert.match(container.innerHTML, /class="slide-card-body"/);
  assert.doesNotMatch(container.innerHTML, /reading-only detail/);
  assert.doesNotMatch(container.innerHTML, /sample-code|Image caption/);
  const agenda = container.innerHTML.match(/data-layout-id="agenda"[\s\S]*?<\/section>/)?.[0] ?? "";
  for (const section of topic.sections) assert.match(agenda, new RegExp(section.title));
  assert.equal((container.innerHTML.match(/data-layout-boundary/g) ?? []).length, topic.presentation.slides.length);
  assert.match(container.innerHTML, /href="\.\.\/seminars\/\?q=&lt;&amp;"/);
});

test("reports only boundaries exceeding the one-pixel overflow tolerance", () => {
  const root = {
    querySelectorAll: () => [
      { scrollWidth: 100, clientWidth: 100, scrollHeight: 100, clientHeight: 100, dataset: { layoutId: "fits" } },
      { scrollWidth: 100, clientWidth: 100, scrollHeight: 102, clientHeight: 100, dataset: { layoutId: "tall" } },
    ],
  };
  assert.deepEqual(findLayoutOverflow(root), [{ id: "tall", horizontal: false, vertical: true }]);
});

test("waits for fonts, pending images, and an animation frame before inspection", async () => {
  const events = [];
  let settleImage;
  const pendingImage = {
    complete: false,
    addEventListener: (name, listener) => { if (name === "load") settleImage = listener; },
    removeEventListener() {},
  };
  const root = {
    querySelectorAll: (selector) => selector === "img" ? [pendingImage] : [{
      scrollWidth: 102, clientWidth: 100, scrollHeight: 100, clientHeight: 100, dataset: { layoutId: "wide" },
    }],
  };
  const inspected = inspectLayoutAfterRender(root, {
    documentRef: { fonts: { ready: Promise.resolve().then(() => events.push("fonts")) } },
    windowRef: { requestAnimationFrame: (callback) => { events.push("frame"); callback(); } },
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(events, ["fonts"]);
  settleImage();
  assert.deepEqual(await inspected, [{ id: "wide", horizontal: true, vertical: false }]);
  assert.deepEqual(events, ["fonts", "frame"]);
});

test("does not delay complete images and tolerates decode rejection", async () => {
  const root = {
    querySelectorAll: (selector) => selector === "img" ? [{ complete: true, decode: () => Promise.reject(new Error("decode")) }] : [],
  };
  assert.deepEqual(await inspectLayoutAfterRender(root, {}), []);
});

test("settles pending images after an error event", async () => {
  let settleError;
  const root = {
    querySelectorAll: (selector) => selector === "img" ? [{
      complete: false,
      addEventListener: (name, listener) => { if (name === "error") settleError = listener; },
      removeEventListener() {},
    }] : [],
  };
  const inspected = inspectLayoutAfterRender(root, {});
  await Promise.resolve();
  assert.equal(typeof settleError, "function");
  settleError();
  assert.deepEqual(await inspected, []);
});

test("waits for complete image decode before requesting a frame", async () => {
  const events = [];
  let resolveDecode;
  const root = {
    querySelectorAll: (selector) => selector === "img" ? [{
      complete: true,
      decode: () => new Promise((resolve) => { resolveDecode = resolve; }),
    }] : [],
  };
  const inspected = inspectLayoutAfterRender(root, {
    windowRef: { requestAnimationFrame: (callback) => { events.push("frame"); callback(); } },
  });
  await Promise.resolve();
  assert.deepEqual(events, []);
  resolveDecode();
  assert.deepEqual(await inspected, []);
  assert.deepEqual(events, ["frame"]);
});
