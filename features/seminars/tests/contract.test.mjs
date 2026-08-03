import assert from "node:assert/strict";
import test from "node:test";

import { validateSeminar } from "../data/validation.js";
import { createValidSeminar } from "./fixtures.mjs";

test("accepts a complete introductory seminar", () => {
  const validTopic = createValidSeminar();
  assert.equal(validateSeminar(validTopic), validTopic);
});

test("requires the five semantic roles in order", () => {
  const validTopic = createValidSeminar();
  assert.throws(
    () => validateSeminar(createValidSeminar({ sections: validTopic.sections.slice(0, 4) })),
    /sections.*problem.*prior-art.*method.*cases.*conclusion/,
  );
});

test("rejects duplicate block IDs", () => {
  const topicWithDuplicateBlockIds = createValidSeminar();
  topicWithDuplicateBlockIds.sections[1].blocks[0].id = "sample-problem";
  assert.throws(() => validateSeminar(topicWithDuplicateBlockIds), /duplicate block id/);
});

test("rejects a missing presentation block reference", () => {
  const topicWithMissingBlockReference = createValidSeminar();
  topicWithMissingBlockReference.presentation.slides[2].blockIds = ["missing-block"];
  assert.throws(() => validateSeminar(topicWithMissingBlockReference), /missing block reference/);
});

test("requires alt text for non-decorative images", () => {
  const topicWithUnlabelledImage = createValidSeminar();
  topicWithUnlabelledImage.sections[0].blocks[0] = {
    id: "sample-problem",
    type: "image",
    src: "/features/seminars/assets/sample-intro/problem.webp",
    alt: "",
  };
  assert.throws(() => validateSeminar(topicWithUnlabelledImage), /image.*alt.*decorative/);
});

test("requires credit for non-owned images", () => {
  const topicWithUncreditedRemoteImage = createValidSeminar();
  topicWithUncreditedRemoteImage.sections[0].blocks[0] = {
    id: "sample-problem",
    type: "image",
    src: "/features/seminars/assets/sample-intro/problem.webp",
    alt: "Sample problem",
    owned: false,
  };
  assert.throws(() => validateSeminar(topicWithUncreditedRemoteImage), /image.*credit/);
});
