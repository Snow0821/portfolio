export function createDownloadButton(topicId, mode) {
  let clickHandler;
  const classes = new Set();
  const icon = { textContent: "📥" };

  return {
    dataset: { topicId, mode },
    disabled: false,
    icon,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    querySelector: (selector) => (selector === ".icon" ? icon : null),
    addEventListener: (eventName, handler) => {
      if (eventName === "click") clickHandler = handler;
    },
    click: () => clickHandler({ preventDefault() {} }),
  };
}

export function createFakeDocument() {
  class FakeElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.className = "";
      this.id = "";
      this.parentNode = null;
      this.style = {};
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      this.children = this.children.filter((candidate) => candidate !== child);
      child.parentNode = null;
    }

    remove() {
      this.parentNode?.removeChild(this);
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] ?? null;
    }

    querySelectorAll(selector) {
      const requiredClasses = selector
        .split(".")
        .filter(Boolean)
        .map((name) => name.trim());
      const matches = [];
      const visit = (element) => {
        const classes = element.className.split(/\s+/).filter(Boolean);
        if (requiredClasses.every((name) => classes.includes(name))) {
          matches.push(element);
        }
        element.children.forEach(visit);
      };
      this.children.forEach(visit);
      return matches;
    }
  }

  return {
    body: new FakeElement("body"),
    createElement: (tagName) => new FakeElement(tagName),
  };
}
