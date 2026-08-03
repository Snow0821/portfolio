import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { pythonIntroData } from "../data/topics/python-intro.js";
import { getSeminar, getSeminarList } from "../data/seminars.js";
import { webIntroData } from "../data/topics/web-intro.js";
import { SECTION_ROLES, validateSeminar } from "../data/validation.js";

const projectRoot = resolve(import.meta.dirname, "../../..");

function imageBlocks(topic) {
  return topic.sections.flatMap(({ blocks }) => blocks.filter(({ type }) => type === "image"));
}

test("provides the two migrated introductory seminars through the lazy registry", () => {
  assert.deepEqual(getSeminarList().map(({ id }) => id), ["python-intro", "web-intro"]);
  assert.equal(getSeminar("python-intro"), pythonIntroData);
  assert.equal(getSeminar("web-intro"), webIntroData);
  assert.equal(getSeminar("missing"), null);
});

test("keeps migrated seminar content valid, structured, and free of legacy view data", () => {
  for (const topic of getSeminarList()) {
    assert.equal(validateSeminar(topic), topic);
    assert.equal("slides" in topic, false);
    assert.equal("doc" in topic, false);
    assert.deepEqual(topic.sections.map(({ role }) => role), SECTION_ROLES);
    assert.deepEqual(
      new Set(topic.presentation.slides.filter(({ type }) => type === "content").map(({ sectionRole }) => sectionRole)),
      new Set(SECTION_ROLES),
    );
  }
});

test("references only existing topic-local production images", () => {
  for (const topic of getSeminarList()) {
    for (const block of imageBlocks(topic)) {
      assert.equal(existsSync(resolve(projectRoot, block.src.slice(1))), true, block.src);
    }
  }
});
