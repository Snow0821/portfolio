import assert from "node:assert/strict";
import test from "node:test";

function createElementBase() {
  return class {
    constructor() {
      this.attributes = new Map();
      this.innerHTML = "";
      this.isConnected = true;
    }

    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    }
  };
}

async function importHeader(label) {
  return import(`../components/slide-header.js?${label}`);
}

test("registers only an absent slide-header definition and rerenders connected changes", async (t) => {
  const originalElement = globalThis.HTMLElement;
  const originalRegistry = globalThis.customElements;
  const definitions = new Map();
  const registrations = [];
  globalThis.HTMLElement = createElementBase();
  globalThis.customElements = {
    get: (name) => definitions.get(name),
    define: (name, value) => { definitions.set(name, value); registrations.push(name); },
  };
  t.after(() => {
    globalThis.HTMLElement = originalElement;
    globalThis.customElements = originalRegistry;
  });
  const { SlideHeader } = await importHeader("absent");
  const header = new SlideHeader();
  header.attributes.set("title", "Initial");
  header.render();
  header.attributes.set("title", "Changed");
  header.attributeChangedCallback("title", "Initial", "Changed");

  assert.deepEqual(registrations, ["slide-header"]);
  assert.match(header.innerHTML, /Changed/);
  assert.equal(definitions.get("slide-header"), SlideHeader);
});

test("does not replace an existing slide-header definition", async (t) => {
  const originalElement = globalThis.HTMLElement;
  const originalRegistry = globalThis.customElements;
  const existing = class {};
  let registrations = 0;
  globalThis.HTMLElement = createElementBase();
  globalThis.customElements = { get: () => existing, define: () => { registrations += 1; } };
  t.after(() => {
    globalThis.HTMLElement = originalElement;
    globalThis.customElements = originalRegistry;
  });
  await importHeader("existing");

  assert.equal(registrations, 0);
});
