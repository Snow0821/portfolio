import assert from "node:assert/strict";
import test from "node:test";

function createDownloadControl(topicId, mode) {
  const attributes = new Map();
  const classes = new Set();
  const handlers = new Map();
  const icon = { textContent: "📥" };
  const control = {
    dataset: { topicId, mode }, icon, events: [],
    classList: {
      add: (name) => classes.add(name), remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    querySelector: () => icon,
    addEventListener: (name, handler) => handlers.set(name, handler),
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    getAttribute: (name) => attributes.get(name) ?? null,
  };
  const dispatch = (type, initial = {}) => {
    const event = {
      ...initial, defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
    };
    control.events.push({ type, event });
    return { event, result: handlers.get(type)?.(event) };
  };
  control.click = () => dispatch("click");
  control.keydown = (key) => dispatch("keydown", { key });
  return control;
}

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
  let downloadCalls = 0;
  const button = createDownloadControl("sample", "vertical");
  const container = { innerHTML: "", querySelectorAll: () => [button] };

  renderSeminarList(container, {
    seminars: [],
    paths: {},
    canDownloadDirectly: () => false,
    onDownload: () => { downloadCalls += 1; },
  });

  const click = button.click();
  assert.equal(click.event.defaultPrevented, false);
  assert.equal(downloadCalls, 0);
  assert.equal(button.getAttribute("aria-disabled"), null);
  assert.equal(button.classList.contains("loading"), false);
  assert.equal(button.icon.textContent, "📥");
  await click.result;
});

test("guards one direct export and exposes its pending ARIA state", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  let finishDownload;
  let downloadCalls = 0;
  const pendingDownload = new Promise((resolve) => { finishDownload = resolve; });
  const button = createDownloadControl("sample", "horizontal");
  const container = { innerHTML: "", querySelectorAll: () => [button] };

  renderSeminarList(container, {
    seminars: [],
    paths: {},
    canDownloadDirectly: () => true,
    onDownload: () => { downloadCalls += 1; return pendingDownload; },
  });

  const firstClick = button.click();
  const repeatedClick = button.click();
  assert.equal(firstClick.event.defaultPrevented, true);
  assert.equal(repeatedClick.event.defaultPrevented, true);
  assert.equal(downloadCalls, 1);
  assert.equal(button.getAttribute("aria-disabled"), "true");
  assert.equal(button.classList.contains("loading"), true);
  assert.equal(button.icon.textContent, "⏳");
  finishDownload();
  await Promise.all([firstClick.result, repeatedClick.result]);
  assert.equal(button.getAttribute("aria-disabled"), null);
  assert.equal(button.classList.contains("loading"), false);
  assert.equal(button.icon.textContent, "📥");
});

test("activates an ARIA PDF button with Space but leaves Enter native", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  const button = createDownloadControl("sample", "vertical");
  const container = { innerHTML: "", querySelectorAll: () => [button] };
  renderSeminarList(container, {
    seminars: [], paths: {}, canDownloadDirectly: () => false,
  });

  const enter = button.keydown("Enter");
  assert.equal(enter.event.defaultPrevented, false);
  assert.deepEqual(button.events.map(({ type }) => type), ["keydown"]);

  const space = button.keydown(" ");
  assert.equal(space.event.defaultPrevented, true);
  assert.deepEqual(button.events.map(({ type }) => type), ["keydown", "keydown", "click"]);
  assert.equal(button.events[2].event.defaultPrevented, false);
  await space.result;
});

test("restores download controls after a failed callback", async () => {
  const { renderSeminarList } = await import("../components/seminar-list.js");
  const button = createDownloadControl("sample", "vertical");
  const container = { innerHTML: "", querySelectorAll: () => [button] };

  renderSeminarList(container, {
    seminars: [],
    paths: {},
    canDownloadDirectly: () => true,
    onDownload: async () => { throw new Error("download failed"); },
  });

  await assert.rejects(button.click().result, /download failed/);
  assert.equal(button.getAttribute("aria-disabled"), null);
  assert.equal(button.classList.contains("loading"), false);
  assert.equal(button.icon.textContent, "📥");
});
