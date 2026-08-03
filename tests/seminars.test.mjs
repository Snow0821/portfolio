import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { createDownloadButton } from "./helpers/fake-dom.mjs";
import { projectRoot } from "./helpers/files.mjs";

test("seminar page package and accessible list component are available", async () => {
  const requiredFiles = [
    "pages/seminars/index.html",
    "pages/seminars/page.js",
    "pages/seminars/page.css",
    "components/seminar-list.js",
    "styles/components/seminar-card.css",
  ];
  const missingFiles = requiredFiles.filter(
    (path) => !existsSync(resolve(projectRoot, path)),
  );
  assert.deepEqual(missingFiles, []);

  const componentUrl = pathToFileURL(
    resolve(projectRoot, "components/seminar-list.js"),
  );
  const { renderSeminarList } = await import(componentUrl.href);
  const callbacks = [];
  const buttons = [
    createDownloadButton("sample", "vertical"),
    createDownloadButton("sample", "horizontal"),
  ];
  const container = {
    innerHTML: "",
    querySelectorAll: () => buttons,
  };

  renderSeminarList(container, {
    seminars: [
      {
        id: "sample",
        title: "샘플 세미나",
        subtitle: "Sample Seminar",
        summary: "컴포넌트 계약 검증용 데이터",
        tags: ["Sample"],
      },
    ],
    paths: {
      vertical: (topicId) => `/read?topic=${topicId}`,
      horizontal: (topicId) => `/slides?topic=${topicId}`,
    },
    onDownload: (payload) => callbacks.push(payload),
  });

  assert.match(container.innerHTML, /href="\/read\?topic=sample"/);
  assert.match(container.innerHTML, /href="\/slides\?topic=sample"/);
  assert.match(
    container.innerHTML,
    /aria-label="샘플 세미나 읽기용 문서 PDF 다운로드"/,
  );
  assert.match(
    container.innerHTML,
    /aria-label="샘플 세미나 발표용 슬라이드 PDF 다운로드"/,
  );

  await buttons[0].click();
  assert.equal(callbacks.length, 1);
  assert.equal(callbacks[0].topicId, "sample");
  assert.equal(callbacks[0].mode, "vertical");

  let finishDownload;
  const pendingButton = createDownloadButton("sample", "horizontal");
  const pendingContainer = {
    innerHTML: "",
    querySelectorAll: () => [pendingButton],
  };
  renderSeminarList(pendingContainer, {
    seminars: [],
    paths: {},
    onDownload: () =>
      new Promise((resolveDownload) => {
        finishDownload = resolveDownload;
      }),
  });

  const pendingClick = pendingButton.click();
  assert.equal(pendingButton.disabled, true);
  assert.equal(pendingButton.classList.contains("loading"), true);
  assert.equal(pendingButton.icon.textContent, "⏳");
  finishDownload();
  await pendingClick;
  assert.equal(pendingButton.disabled, false);
  assert.equal(pendingButton.classList.contains("loading"), false);
  assert.equal(pendingButton.icon.textContent, "📥");
});

test("seminar print fallback URL preserves mode and topic", async () => {
  const seminarsPageUrl = pathToFileURL(
    resolve(projectRoot, "pages/seminars/page.js"),
  );
  const { createPrintFallbackUrl } = await import(seminarsPageUrl.href);

  assert.equal(
    createPrintFallbackUrl("horizontal", "web-intro"),
    "../presentation/horizontal.html?topic=web-intro&print=true",
  );
});
