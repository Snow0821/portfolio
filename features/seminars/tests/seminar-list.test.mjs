import assert from "node:assert/strict";
import test from "node:test";

import { createDownloadButton } from "../../../tests/helpers/fake-dom.mjs";

test("renders escaped seminar cards with distinct accessible PDF names", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  const container = { innerHTML: "", querySelectorAll: () => [] };

  renderSeminarList(container, {
    seminars: [
      {
        id: 'sample"&',
        title: 'Sample <script> "title"',
        subtitle: "Introduction",
        summary: "Safe & useful",
        tags: ["Web <Basics>"],
      },
      {
        id: "second",
        title: "Second topic",
        subtitle: "Introduction",
        summary: "Another summary",
        tags: ["Sample"],
      },
    ],
    paths: {
      vertical: (id) => `/read?topic=${id}&format=pdf`,
      horizontal: (id) => `/slides?topic=${id}&format=pdf`,
      verticalPrint: (id) => `/read?topic=${id}&print=true`,
      horizontalPrint: (id) => `/slides?topic=${id}&print=true`,
    },
  });

  assert.match(container.innerHTML, /Sample &lt;script&gt; "title"/);
  assert.match(container.innerHTML, /Web &lt;Basics&gt;/);
  assert.match(container.innerHTML, /읽기용 문서 \(세로\) ↗/);
  assert.match(container.innerHTML, /aria-label="Sample &lt;script&gt; &quot;title&quot; 읽기용 문서 PDF 다운로드"/);
  assert.match(container.innerHTML, /data-topic-id="sample&quot;&amp;"/);
  assert.match(container.innerHTML, /href="\/read\?topic=sample&quot;&amp;&amp;format=pdf"/);
  assert.match(
    container.innerHTML,
    /href="\/read\?topic=sample&quot;&amp;&amp;print=true" target="_blank" rel="noopener noreferrer" role="button" class="btn-icon-download"/,
  );
  assert.match(
    container.innerHTML,
    /href="\/slides\?topic=sample&quot;&amp;&amp;print=true" target="_blank" rel="noopener noreferrer" role="button" class="btn-icon-download"/,
  );
  const names = [...container.innerHTML.matchAll(/aria-label="([^"]+)"/g)]
    .map(([, name]) => name);
  assert.equal(names.length, 4);
  assert.equal(new Set(names).size, 4);
});

test("leaves native PDF fallback navigation untouched without direct export", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  let clickHandler;
  let defaultPrevented = false;
  let downloadCalls = 0;
  const classes = new Set();
  const icon = { textContent: "PDF" };
  const button = {
    dataset: { topicId: "sample", mode: "vertical" },
    disabled: false,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    querySelector: () => icon,
    addEventListener: (eventName, handler) => {
      if (eventName === "click") clickHandler = handler;
    },
  };
  const container = { innerHTML: "", querySelectorAll: () => [button] };

  renderSeminarList(container, {
    seminars: [],
    paths: {},
    canDownloadDirectly: () => false,
    onDownload: () => { downloadCalls += 1; },
  });

  const pendingClick = clickHandler({
    preventDefault: () => { defaultPrevented = true; },
  });
  assert.equal(defaultPrevented, false);
  assert.equal(downloadCalls, 0);
  assert.equal(button.disabled, false);
  assert.equal(button.classList.contains("loading"), false);
  assert.equal(icon.textContent, "PDF");
  await pendingClick;
});

test("keeps a download button pending until its callback settles", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  let finishDownload;
  const button = createDownloadButton("sample", "horizontal");
  const container = { innerHTML: "", querySelectorAll: () => [button] };

  renderSeminarList(container, {
    seminars: [],
    paths: {},
    canDownloadDirectly: () => true,
    onDownload: () => new Promise((resolve) => { finishDownload = resolve; }),
  });

  const download = button.click();
  assert.equal(button.disabled, true);
  assert.equal(button.classList.contains("loading"), true);
  assert.equal(button.icon.textContent, "⏳");
  finishDownload();
  await download;
  assert.equal(button.disabled, false);
  assert.equal(button.classList.contains("loading"), false);
  assert.equal(button.icon.textContent, "📥");
});

test("restores download controls after a failed callback", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  const button = createDownloadButton("sample", "vertical");
  const container = { innerHTML: "", querySelectorAll: () => [button] };

  renderSeminarList(container, {
    seminars: [],
    paths: {},
    canDownloadDirectly: () => true,
    onDownload: async () => { throw new Error("download failed"); },
  });

  await assert.rejects(button.click(), /download failed/);
  assert.equal(button.disabled, false);
  assert.equal(button.classList.contains("loading"), false);
  assert.equal(button.icon.textContent, "📥");
});
