export function createTopic(id = "sample") {
  const sections = ["problem", "prior-art", "method", "cases", "conclusion"].map((role) => ({
    role, title: role, blocks: [{ id: `${role}-block`, type: "paragraph", summary: role }],
  }));
  return {
    id, format: "introductory-60", title: "Sample topic", subtitle: "Sample",
    summary: "Summary", tags: ["Sample"], author: "Author", updated: "2026",
    audience: "Everyone", prerequisites: [], outcomes: ["Learn"], sections,
    presentation: {
      slides: [
        { id: "cover", type: "cover" }, { id: "agenda", type: "agenda" },
        ...sections.map((section) => ({
          id: section.role, type: "content", sectionRole: section.role,
          category: section.role, title: section.title, layout: "stack",
          blockIds: [section.blocks[0].id],
        })),
        { id: "outro", type: "outro", title: "Questions", description: "Thanks" },
      ],
    },
  };
}

export function createPageDocument() {
  const container = createElement();
  const list = createElement();
  const calls = [];
  const elements = new Map([
    ["presentation-container", container],
    ["seminar-list-container", list],
  ]);
  return {
    body: { dataset: {} }, title: "", container, list, calls,
    getElementById: (id) => elements.get(id) ?? null,
    querySelector: (selector) => { calls.push(selector); return null; },
    addEventListener() {},
  };
}

function createElement() {
  const attributes = new Map();
  return {
    innerHTML: "", dataset: {},
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    getAttribute: (name) => attributes.get(name) ?? null,
    querySelectorAll: () => [],
  };
}

export function withConsoleError(testFunction) {
  const original = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  return Promise.resolve(testFunction(errors)).finally(() => { console.error = original; });
}
