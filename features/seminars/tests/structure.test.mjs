import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const projectRoot = resolve(import.meta.dirname, "../../..");
const htmlPages = [
  "pages/seminars/index.html",
  "pages/presentation/horizontal.html",
  "pages/presentation/vertical.html",
];
const pageModules = ["pages/seminars/page.js", "pages/presentation/page.js"];
const featureImports = [
  '@import "./seminar-list.css";',
  '@import "./content-block.css";',
  '@import "./presentation-header.css";',
  '@import "./presentation-layout.css";',
  '@import "./presentation-slide.css";',
  '@import "./reading-document.css";',
  '@import "./print.css";',
];

function readProjectFile(path) {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

test("seminar pages load global, feature, and page styles in cascade order", () => {
  const styles = [
    '<link rel="stylesheet" href="../../styles/main.css">',
    '<link rel="stylesheet" href="../../features/seminars/styles/index.css">',
    '<link rel="stylesheet" href="./page.css">',
  ];
  for (const page of htmlPages) {
    const source = readProjectFile(page);
    let previousIndex = -1;
    for (const statement of styles) {
      const index = source.indexOf(statement);
      assert.ok(index > previousIndex, `${page}: ${statement} order`);
      assert.equal(source.split(statement).length - 1, 1, `${page}: ${statement} count`);
      previousIndex = index;
    }
  }
});

test("thin seminar pages import only the public feature facade", () => {
  for (const modulePath of pageModules) {
    const source = readProjectFile(modulePath);
    assert.match(
      source,
      /from "\.\.\/\.\.\/features\/seminars\/index\.js"/,
      `${modulePath}: facade import`,
    );
    const imports = [...source.matchAll(/from "(\.\.\/\.\.\/features\/seminars\/[^"\n]+)"/g)]
      .map((match) => match[1]);
    assert.deepEqual(imports, ["../../features/seminars/index.js"]);
  }
});

test("global styles exclude seminar ownership and feature styles define its cascade", () => {
  const mainCss = readProjectFile("styles/main.css");
  assert.doesNotMatch(mainCss, /seminar-card|components\/presentation/);

  const globalPrint = readProjectFile("styles/print.css");
  for (const declaration of [
    "width: 100% !important;",
    "margin: 0 !important;",
    "padding: 0 !important;",
    "background-color: #ffffff !important;",
  ]) assert.match(globalPrint, new RegExp(`body\\s*\\{[\\s\\S]*?${declaration}`));

  const featureCss = readProjectFile("features/seminars/styles/index.css");
  assert.deepEqual(
    [...featureCss.matchAll(/@import "[^"\n]+";/g)].map((match) => match[0]),
    featureImports,
  );
  let previousIndex = -1;
  for (const statement of featureImports) {
    const index = featureCss.indexOf(statement);
    assert.ok(index > previousIndex, `${statement} import order`);
    previousIndex = index;
  }
  assert.doesNotMatch(
    readProjectFile("features/seminars/styles/presentation-slide.css"),
    /\.slide-card-footer/,
  );
});
