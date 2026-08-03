import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { projectRoot } from "./helpers/files.mjs";

test("shared home foundation uses the new component and content paths", () => {
  const requiredFiles = [
    "components/site-header.js",
    "content/home/about.html",
    "content/home/research.html",
    "content/home/career.html",
    "content/home/academic.html",
    "styles/main.css",
    "styles/base.css",
    "styles/layouts.css",
    "styles/components/site-header.css",
    "styles/components/content-section.css",
  ];
  const missingFiles = requiredFiles.filter(
    (path) => !existsSync(resolve(projectRoot, path)),
  );
  const homePage = readFileSync(resolve(projectRoot, "index.html"), "utf8");

  assert.deepEqual(missingFiles, []);
  assert.match(homePage, /\.\/styles\/main\.css/);
  assert.match(homePage, /\.\/components\/site-header\.js/);
  assert.match(homePage, /\.\/content\/home\/about\.html/);
  assert.match(homePage, /\.\/pages\/seminars\//);
});

test("site header markup identifies only the current destination", async () => {
  const headerUrl = pathToFileURL(
    resolve(projectRoot, "components/site-header.js"),
  );
  const { createSiteHeaderMarkup } = await import(headerUrl.href);
  const markup = createSiteHeaderMarkup({
    homeHref: "/",
    seminarsHref: "/pages/seminars/",
    current: "seminars",
  });

  assert.doesNotMatch(markup, /href="\/" aria-current="page"/);
  assert.match(markup, /href="\/pages\/seminars\/" aria-current="page"/);
});
