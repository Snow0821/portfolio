import assert from "node:assert/strict";
import test from "node:test";

function createControllerDocument() {
  const keyListeners = {};
  const slides = [0, 1].map(() => {
    const slide = { scrollOptions: null };
    slide.scrollIntoView = (options) => { slide.scrollOptions = options; };
    return slide;
  });
  const container = { querySelectorAll: () => slides };
  return {
    querySelector: (selector) => selector === ".slide-container.horizontal" ? container : null,
    getElementById: () => null,
    addEventListener: (name, handler) => { keyListeners[name] = handler; },
    keydown: (key, target = {}) => {
      let prevented = false;
      keyListeners.keydown({ key, target, preventDefault: () => { prevented = true; } });
      return prevented;
    },
    slides,
  };
}

test("navigates with keys when no visible controls exist", async () => {
  const { PresentationController } = await import(
    "../components/presentation-controller.js"
  );
  const documentRef = createControllerDocument();
  const controller = new PresentationController(documentRef);

  assert.equal(controller.currentIndex, 0);
  assert.equal(documentRef.keydown("ArrowRight"), true);
  assert.equal(controller.currentIndex, 1);
  assert.deepEqual(documentRef.slides[1].scrollOptions, {
    behavior: "smooth", block: "start", inline: "start",
  });
  const lastScroll = documentRef.slides[1].scrollOptions;
  documentRef.keydown("ArrowRight");
  assert.equal(controller.currentIndex, 1);
  assert.equal(documentRef.slides[1].scrollOptions, lastScroll);
  assert.equal(documentRef.keydown("ArrowLeft"), true);
  assert.equal(controller.currentIndex, 0);
  for (const control of ["a", "button", "input", "textarea", "select"]) {
    documentRef.keydown("ArrowRight", { closest: () => control });
    assert.equal(controller.currentIndex, 0);
  }
  assert.equal(documentRef.keydown(" "), true);
  assert.equal(controller.currentIndex, 1);
});

test("updates the current slide when the observer sees a different slide", async (t) => {
  const { PresentationController } = await import(
    "../components/presentation-controller.js"
  );
  const originalObserver = globalThis.IntersectionObserver;
  let callback;
  globalThis.IntersectionObserver = class {
    constructor(next) { callback = next; }
    observe() {}
  };
  t.after(() => { globalThis.IntersectionObserver = originalObserver; });
  const documentRef = createControllerDocument();
  const controller = new PresentationController(documentRef);

  callback([{ isIntersecting: true, target: documentRef.slides[1] }]);
  assert.equal(controller.currentIndex, 1);
});

test("renders a public-safe error state", async () => {
  const { renderSeminarError } = await import("../components/error-state.js");
  const container = { innerHTML: "" };

  renderSeminarError(container);
  assert.match(container.innerHTML, /role="alert"/);
  assert.match(container.innerHTML, /자료를 불러올 수 없습니다/);
  assert.doesNotMatch(container.innerHTML, /stack|TypeError|undefined/);
});
