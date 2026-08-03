import assert from "node:assert/strict";
import test from "node:test";

import { createDownloadButton } from "../../../tests/helpers/fake-dom.mjs";

test("renders escaped seminar cards with distinct accessible PDF names", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  const container = { innerHTML: "", querySelectorAll: () => [] };

  renderSeminarList(container, {
    seminars: [{
      id: 'sample"&',
      title: 'Sample <script> "title"',
      subtitle: "Introduction",
      summary: "Safe & useful",
      tags: ["Web <Basics>"],
    }],
    paths: {
      vertical: (id) => `/read?topic=${id}&format=pdf`,
      horizontal: (id) => `/slides?topic=${id}&format=pdf`,
    },
  });

  assert.match(container.innerHTML, /Sample &lt;script&gt; "title"/);
  assert.match(container.innerHTML, /Web &lt;Basics&gt;/);
  assert.match(container.innerHTML, /읽기용 문서 \(세로\) ↗/);
  assert.match(container.innerHTML, /aria-label="Sample &lt;script&gt; &quot;title&quot; 읽기용 문서 PDF 다운로드"/);
  assert.match(container.innerHTML, /data-topic-id="sample&quot;&amp;"/);
  assert.match(container.innerHTML, /href="\/read\?topic=sample&quot;&amp;&amp;format=pdf"/);
  const names = [...container.innerHTML.matchAll(/aria-label="([^"]+)"/g)]
    .map(([, name]) => name);
  assert.equal(names.length, 2);
  assert.notEqual(names[0], names[1]);
});

test("keeps a download button pending until its callback settles", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  let finishDownload;
  const button = createDownloadButton("sample", "horizontal");
  const container = { innerHTML: "", querySelectorAll: () => [button] };

  renderSeminarList(container, {
    seminars: [],
    paths: {},
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
    onDownload: async () => { throw new Error("download failed"); },
  });

  await assert.rejects(button.click(), /download failed/);
  assert.equal(button.disabled, false);
  assert.equal(button.classList.contains("loading"), false);
  assert.equal(button.icon.textContent, "📥");
});
