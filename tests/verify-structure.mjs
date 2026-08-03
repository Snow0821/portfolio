import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("required development and documentation files exist", () => {
  const requiredFiles = [
    ".node-version",
    ".gitignore",
    "AGENTS.md",
    "README.md",
    "package.json",
    "package-lock.json",
    "api/health.mjs",
    "docs/architecture.md",
    "docs/conventions.md",
    "docs/decisions.md",
    "docs/status.md",
    "docs/history/2026.md",
  ];

  const missingFiles = requiredFiles.filter(
    (path) => !existsSync(resolve(root, path)),
  );

  assert.deepEqual(missingFiles, []);
});

test("project and package metadata agree on Node.js 24", () => {
  const version = readFileSync(resolve(root, ".node-version"), "utf8").trim();
  const packageJson = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  );

  assert.equal(version, "24");
  assert.equal(packageJson.engines.node, "24.x");
  assert.equal(packageJson.scripts.test, "node --test tests/*.mjs");
});

test("health function returns a successful JSON response", async () => {
  const healthUrl = pathToFileURL(resolve(root, "api/health.mjs"));
  const { GET } = await import(healthUrl.href);
  const response = GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

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
    (path) => !existsSync(resolve(root, path)),
  );
  const homePage = readFileSync(resolve(root, "index.html"), "utf8");

  assert.deepEqual(missingFiles, []);
  assert.match(homePage, /\.\/styles\/main\.css/);
  assert.match(homePage, /\.\/components\/site-header\.js/);
  assert.match(homePage, /\.\/content\/home\/about\.html/);
  assert.match(homePage, /\.\/pages\/seminars\//);
});

test("site header markup identifies only the current destination", async () => {
  const headerUrl = pathToFileURL(resolve(root, "components/site-header.js"));
  const { createSiteHeaderMarkup } = await import(headerUrl.href);
  const markup = createSiteHeaderMarkup({
    homeHref: "/",
    seminarsHref: "/pages/seminars/",
    current: "seminars",
  });

  assert.doesNotMatch(markup, /href="\/" aria-current="page"/);
  assert.match(
    markup,
    /href="\/pages\/seminars\/" aria-current="page"/,
  );
});
