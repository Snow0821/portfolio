import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import test from "node:test";

import {
  collectFiles,
  countLines,
  extractLocalModuleReferences,
  findFileLengthViolations,
  projectRoot,
  referenceExists,
} from "./helpers/files.mjs";

test("file policy reviews long files and extracts local module references", () => {
  const records = [
    { path: "components/ok.js", lines: 200 },
    { path: "components/review.js", lines: 201 },
    { path: "components/too-long.js", lines: 301 },
  ];
  assert.deepEqual(findFileLengthViolations(records, {}), [
    "components/review.js: 201 lines requires a documented exception",
    "components/too-long.js: 301 lines exceeds 300",
  ]);
  assert.deepEqual(
    findFileLengthViolations(records.slice(0, 2), {
      "components/review.js": "single cohesive state machine",
    }),
    [],
  );

  const source = [
    "im" + 'port "./setup.js";',
    "im" + 'port { render } from "../render.js";',
    "ex" + 'port { schema } from "./schema.mjs";',
    "const lazy = im" + 'port("./lazy.js");',
    "im" + 'port "node:test";',
  ].join("\n");
  assert.deepEqual(extractLocalModuleReferences(source), [
    "./setup.js",
    "../render.js",
    "./schema.mjs",
    "./lazy.js",
  ]);
});

test("repository modules stay focused and resolve local imports", () => {
  const scanRoots = [
    "api",
    "components",
    "features",
    "pages",
    "styles",
    "tests",
    "utils",
  ];
  const sourceFiles = scanRoots
    .flatMap((directory) => collectFiles(resolve(projectRoot, directory)))
    .filter((path) => /\.(?:js|mjs|css)$/.test(path));
  const records = sourceFiles
    .map((path) => ({
      absolutePath: path,
      relativePath: relative(projectRoot, path).split(sep).join("/"),
    }))
    .filter(
      ({ relativePath }) =>
        !relativePath.startsWith("features/seminars/data/topics/"),
    )
    .map(({ absolutePath, relativePath }) => ({
      path: relativePath,
      lines: countLines(readFileSync(absolutePath, "utf8")),
    }));

  assert.deepEqual(findFileLengthViolations(records, {}), []);

  const missingImports = sourceFiles
    .filter((path) => /\.(?:js|mjs)$/.test(path))
    .flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return extractLocalModuleReferences(source)
        .filter((reference) => !referenceExists(path, reference))
        .map(
          (reference) =>
            `${relative(projectRoot, path).split(sep).join("/")}: ${reference}`,
        );
    });
  assert.deepEqual(missingImports, []);
});
