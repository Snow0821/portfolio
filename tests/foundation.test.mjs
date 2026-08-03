import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { projectRoot } from "./helpers/files.mjs";

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
    (path) => !existsSync(resolve(projectRoot, path)),
  );

  assert.deepEqual(missingFiles, []);
});

test("project and package metadata agree on Node.js 24", () => {
  const version = readFileSync(
    resolve(projectRoot, ".node-version"),
    "utf8",
  ).trim();
  const packageJson = JSON.parse(
    readFileSync(resolve(projectRoot, "package.json"), "utf8"),
  );

  assert.equal(version, "24");
  assert.equal(packageJson.engines.node, "24.x");
  assert.equal(
    packageJson.scripts.test,
    "node --test tests/*.test.mjs features/seminars/tests/*.test.mjs",
  );
});

test("Vercel CLI is not invoked from the reserved package dev script", () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(projectRoot, "package.json"), "utf8"),
  );

  assert.equal(packageJson.scripts.dev, undefined);
  assert.equal(
    packageJson.scripts["dev:vercel"],
    "vercel dev --listen 3000",
  );
});

test("health function returns a successful JSON response", async () => {
  const healthUrl = pathToFileURL(resolve(projectRoot, "api/health.mjs"));
  const { GET } = await import(healthUrl.href);
  const response = GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("shared HTML utilities separate text and attribute escaping", async () => {
  const utilityUrl = pathToFileURL(resolve(projectRoot, "utils/html.js"));
  const { escapeAttribute, escapeHtml } = await import(utilityUrl.href);

  assert.equal(
    escapeHtml('<Snow & "Web">'),
    '&lt;Snow &amp; "Web"&gt;',
  );
  assert.equal(
    escapeAttribute('<Snow & "Web">'),
    "&lt;Snow &amp; &quot;Web&quot;&gt;",
  );
});
