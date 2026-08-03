import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { collectFiles, projectRoot } from "./helpers/files.mjs";

test("repository file collection ignores nested worktrees", () => {
  const fixtureRoot = mkdtempSync(resolve(tmpdir(), "portfolio-files-"));

  try {
    mkdirSync(resolve(fixtureRoot, ".worktrees", "task"), { recursive: true });
    writeFileSync(resolve(fixtureRoot, ".worktrees", "task", "ignored.md"), "old");
    writeFileSync(resolve(fixtureRoot, "kept.md"), "current");

    const collected = collectFiles(fixtureRoot).map((path) =>
      relative(fixtureRoot, path),
    );

    assert.deepEqual(collected, ["kept.md"]);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

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
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(packageJson.scripts).filter(
        ([name]) => name === "test" || name === "verify" || name.startsWith("test:"),
      ),
    ),
    {
      test: "node --test --test-reporter=dot tests/*.test.mjs features/seminars/tests/*.test.mjs",
      "test:foundation": "node --test --test-reporter=dot tests/foundation.test.mjs tests/home.test.mjs",
      "test:seminars:content": "node --test --test-reporter=dot features/seminars/tests/contract.test.mjs features/seminars/tests/data.test.mjs features/seminars/tests/layouts.test.mjs features/seminars/tests/rendering-escaping.test.mjs",
      "test:seminars:ui": "node --test --test-reporter=dot features/seminars/tests/pages.test.mjs features/seminars/tests/presentation-components.test.mjs features/seminars/tests/seminar-list.test.mjs features/seminars/tests/seminars-page.test.mjs",
      "test:structure": "node --test --test-reporter=dot tests/module-policy.test.mjs tests/structure.test.mjs features/seminars/tests/structure.test.mjs",
      verify: "npm test && git diff --check",
    },
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
