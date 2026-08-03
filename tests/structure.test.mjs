import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  collectFiles,
  projectRoot,
  referenceExists,
} from "./helpers/files.mjs";

test("completed work leaves only canonical project documentation", () => {
  assert.equal(existsSync(resolve(projectRoot, "docs/superpowers")), false);
  const readme = readFileSync(resolve(projectRoot, "README.md"), "utf8");
  assert.doesNotMatch(readme, /superpowers|handoff-design|핸드오프/);
});

test("legacy structure and references are fully removed", () => {
  const forbiddenPaths = [
    "seminar.html",
    "sections",
    "slides",
    "components/level3-seminar-page",
    "components/level4-presentation",
    "components/document-renderer.js",
    "components/presentation-controller.js",
    "components/slide-controller.js",
    "components/slide-header.js",
    "components/slide-renderer.js",
    "services/pdf-exporter.js",
    "styles/components/presentation.css",
    "styles/style.css",
    "styles/level1-main",
    "styles/level2-navigation",
    "styles/level3-seminar-page",
    "styles/level4-presentation",
    "styles/components/intro.css",
    "styles/components/section.css",
    "tests/verify-structure.ps1",
    "log",
    "docs/plan.md",
  ];
  const existingLegacyPaths = forbiddenPaths.filter((path) =>
    existsSync(resolve(projectRoot, path)),
  );
  assert.deepEqual(existingLegacyPaths, []);

  const legacyReferencePatterns = [
    /seminar\.html/,
    /(?:\.\.\/|\.\/)sections\//,
    /(?:\.\.\/|\.\/)slides\//,
    /level[1-4]-(?:main|navigation|seminar-page|presentation)/,
    /verify-structure\.ps1/,
    /styles\/style\.css/,
  ];
  const sourceFiles = collectFiles(projectRoot).filter((path) => {
    const relativePath = path.slice(projectRoot.length + 1);
    return (
      /\.(?:html|css|js|mjs|md)$/.test(path) &&
      relativePath !== "tests/structure.test.mjs" &&
      relativePath !== "tests/verify-structure.mjs" &&
      relativePath !== "docs/history/2026.md"
    );
  });
  const staleReferences = sourceFiles.flatMap((path) => {
    const source = readFileSync(path, "utf8");
    return legacyReferencePatterns
      .filter((pattern) => pattern.test(source))
      .map((pattern) => `${path.slice(projectRoot.length + 1)}: ${pattern}`);
  });

  assert.deepEqual(staleReferences, []);
});

test("local HTML and CSS references resolve to existing files", () => {
  const missingReferences = [];

  for (const path of collectFiles(projectRoot)) {
    if (path.endsWith(".html")) {
      const source = readFileSync(path, "utf8");
      for (const match of source.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
        const reference = match[1];
        if (/^(?:[a-z]+:|#)/i.test(reference)) continue;
        if (!referenceExists(path, reference)) {
          missingReferences.push(
            `${path.slice(projectRoot.length + 1)}: ${reference}`,
          );
        }
      }
    }

    if (path.endsWith(".css")) {
      const source = readFileSync(path, "utf8");
      for (const match of source.matchAll(/@import\s+["']([^"']+)["']/g)) {
        if (!referenceExists(path, match[1])) {
          missingReferences.push(
            `${path.slice(projectRoot.length + 1)}: ${match[1]}`,
          );
        }
      }
    }
  }

  assert.deepEqual(missingReferences, []);
});

test("presentation styles load by responsibility in cascade order", () => {
  const styleFiles = [
    "styles/components/presentation/header.css",
    "styles/components/presentation/layout.css",
    "styles/components/presentation/slide-card.css",
    "styles/components/presentation/reading-document.css",
  ];
  const missingFiles = styleFiles.filter(
    (path) => !existsSync(resolve(projectRoot, path)),
  );
  assert.deepEqual(missingFiles, []);

  const statements = [
    '@import "./components/presentation/header.css";',
    '@import "./components/presentation/layout.css";',
    '@import "./components/presentation/slide-card.css";',
    '@import "./components/presentation/reading-document.css";',
  ];
  const mainCss = readFileSync(
    resolve(projectRoot, "styles/main.css"),
    "utf8",
  );
  let previousIndex = -1;
  for (const statement of statements) {
    const currentIndex = mainCss.indexOf(statement);
    assert.ok(currentIndex > previousIndex, `${statement} import order`);
    previousIndex = currentIndex;
  }
  assert.doesNotMatch(mainCss, /components\/presentation\.css/);
});
