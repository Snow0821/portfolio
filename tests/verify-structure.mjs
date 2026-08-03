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
