import assert from "node:assert/strict";
import test from "node:test";

test("renders escaped seminar cards with only the two HTML-view links", async () => {
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
      vertical: (id) => `/read?topic=${id}`,
      horizontal: (id) => `/slides?topic=${id}`,
    },
  });

  assert.match(container.innerHTML, /Sample &lt;script&gt; "title"/);
  assert.match(container.innerHTML, /Web &lt;Basics&gt;/);
  assert.match(container.innerHTML, /href="\/read\?topic=sample&quot;&amp;"/);
  assert.match(container.innerHTML, /href="\/slides\?topic=sample&quot;&amp;"/);
  assert.match(container.innerHTML, /읽기용 문서 \(세로\) ↗/);
  assert.match(container.innerHTML, /발표용 슬라이드 \(가로\) ↗/);
  assert.doesNotMatch(
    container.innerHTML,
    /btn-icon-download|PDF 다운로드|data-topic-id|data-mode/,
  );
  assert.equal([...container.innerHTML.matchAll(/<a /g)].length, 4);
  assert.equal(
    [...container.innerHTML.matchAll(/target="_blank" rel="noopener noreferrer"/g)].length,
    4,
  );
});
