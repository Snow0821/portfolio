import assert from "node:assert/strict";
import test from "node:test";

function createControllerDocument() {
  const keyListeners = {};
  const makeButton = () => {
    let clickHandler;
    return {
    disabled: false,
      addEventListener: (_, handler) => { clickHandler = handler; },
      click: () => clickHandler(),
    };
  };
  const slides = [0, 1].map(() => {
    const slide = { scrollOptions: null };
    slide.scrollIntoView = (options) => { slide.scrollOptions = options; };
    return slide;
  });
  const container = { querySelectorAll: () => slides };
  const counter = { textContent: "" };
  const previous = makeButton();
  const next = makeButton();
  return {
    querySelector: (selector) => selector === ".slide-container.horizontal" ? container : null,
    getElementById: (id) => ({
      "slide-counter": counter,
      "prev-slide": previous,
      "next-slide": next,
    })[id] ?? null,
    addEventListener: (name, handler) => { keyListeners[name] = handler; },
    keydown: (key, target = {}) => {
      let prevented = false;
      keyListeners.keydown({ key, target, preventDefault: () => { prevented = true; } });
      return prevented;
    },
    counter,
    previous,
    next,
    slides,
  };
}

test("renders a safe header and omits navigation outside presentation mode", async () => {
  const { SlideHeader, createSlideHeaderMarkup } = await import(
    "../components/slide-header.js"
  );
  const readingHeader = createSlideHeaderMarkup({
    title: "Fallback <title>",
    badge: "Reading",
    altHref: "./horizontal.html?topic=fallback",
    altText: "View slides",
    isPresentation: false,
  });

  assert.ok(SlideHeader.observedAttributes.includes("title"));
  assert.ok(SlideHeader.observedAttributes.includes("is-presentation"));
  assert.match(readingHeader, /Fallback &lt;title&gt;/);
  assert.match(readingHeader, /horizontal\.html\?topic=fallback/);
  assert.doesNotMatch(readingHeader, /id="next-slide"/);
  assert.match(createSlideHeaderMarkup(), /id="next-slide"/);
});

test("navigates two presentation slides while ignoring focusable controls", async () => {
  const { PresentationController } = await import(
    "../components/presentation-controller.js"
  );
  const documentRef = createControllerDocument();
  new PresentationController(documentRef);

  assert.equal(documentRef.counter.textContent, "1 / 2");
  assert.equal(documentRef.previous.disabled, true);
  assert.equal(documentRef.next.disabled, false);
  assert.equal(documentRef.keydown("ArrowRight"), true);
  assert.equal(documentRef.counter.textContent, "2 / 2");
  assert.equal(documentRef.previous.disabled, false);
  assert.equal(documentRef.next.disabled, true);
  assert.equal(documentRef.keydown("ArrowLeft"), true);
  assert.equal(documentRef.counter.textContent, "1 / 2");
  for (const control of ["a", "button", "input", "textarea", "select"]) {
    documentRef.keydown("ArrowRight", { closest: () => control });
    assert.equal(documentRef.counter.textContent, "1 / 2");
  }
  documentRef.next.click();
  assert.equal(documentRef.counter.textContent, "2 / 2");
  documentRef.previous.click();
  assert.equal(documentRef.counter.textContent, "1 / 2");
});

test("renders a public-safe error state", async () => {
  const { renderSeminarError } = await import("../components/error-state.js");
  const container = { innerHTML: "" };

  renderSeminarError(container);
  assert.match(container.innerHTML, /role="alert"/);
  assert.match(container.innerHTML, /자료를 불러올 수 없습니다/);
  assert.doesNotMatch(container.innerHTML, /stack|TypeError|undefined/);
});
