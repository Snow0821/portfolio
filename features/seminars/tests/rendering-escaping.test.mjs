import assert from "node:assert/strict";
import test from "node:test";

import { renderContentBlock } from "../components/content-block.js";
import { renderReadingDocument } from "../layouts/reading-document.js";
import { renderPresentationSlides } from "../layouts/presentation-slides.js";
import { createValidSeminar } from "./fixtures.mjs";

const unsafe = `<unsafe>&"`;
const escapedText = "&lt;unsafe&gt;&amp;\"";
const escapedAttribute = "&lt;unsafe&gt;&amp;&quot;";

test("escapes every text and attribute field in the seven block renderers", () => {
  const markup = [
    { type: "heading", level: 2, text: unsafe },
    { type: "paragraph", summary: unsafe, detail: unsafe },
    { type: "list", items: [unsafe] },
    { type: "code", language: unsafe, caption: unsafe, code: unsafe },
    { type: "quote", text: unsafe, attribution: unsafe, source: unsafe },
    { type: "summary", items: [unsafe] },
    { type: "image", src: unsafe, alt: unsafe, caption: unsafe, credit: unsafe },
  ].map((block) => renderContentBlock(block, { view: "reading" })).join("");
  assert.equal((markup.match(new RegExp(escapedText, "g")) ?? []).length, 12);
  assert.equal((markup.match(new RegExp(escapedAttribute, "g")) ?? []).length, 3);
  assert.doesNotMatch(markup, /<unsafe>/);
  assert.match(markup, /language-&lt;unsafe&gt;&amp;&quot;/);
  assert.match(markup, /src="&lt;unsafe&gt;&amp;&quot;" alt="&lt;unsafe&gt;&amp;&quot;"/);
});

test("escapes topic and slide metadata in both projections", () => {
  const topic = createValidSeminar({
    title: unsafe, subtitle: unsafe, summary: unsafe, tags: [unsafe], author: unsafe,
    updated: unsafe, audience: unsafe, prerequisites: [unsafe], outcomes: [unsafe],
  });
  const content = topic.presentation.slides[2];
  content.id = unsafe;
  content.sectionRole = unsafe;
  content.category = unsafe;
  content.title = unsafe;
  content.layout = unsafe;
  const reading = { innerHTML: "" };
  const slides = { innerHTML: "" };
  renderReadingDocument(reading, topic);
  renderPresentationSlides(slides, topic);
  assert.doesNotMatch(`${reading.innerHTML}${slides.innerHTML}`, /<unsafe>/);
  assert.match(slides.innerHTML, new RegExp(`data-layout-id="${escapedAttribute}"`));
  assert.match(slides.innerHTML, new RegExp(escapedText));
});

test("rejects unsupported semantic block types with the Korean contract error", () => {
  assert.throws(
    () => renderContentBlock({ type: "video" }),
    new TypeError("지원하지 않는 세미나 블록: video"),
  );
});
