const BaseElement = globalThis.HTMLElement ?? class {};

function currentAttribute(current, destination) {
  return current === destination ? ' aria-current="page"' : "";
}

export function createSiteHeaderMarkup({
  homeHref = "./index.html",
  seminarsHref = "./pages/seminars/",
  current = "",
} = {}) {
  return `
    <header class="site-header">
      <a class="site-header__brand" href="${homeHref}">Snow Choi</a>
      <nav class="site-header__nav" aria-label="주요 메뉴">
        <a href="${homeHref}"${currentAttribute(current, "about")}>About</a>
        <a href="${seminarsHref}"${currentAttribute(current, "seminars")}>Seminars</a>
      </nav>
    </header>
  `;
}

export class SiteHeader extends BaseElement {
  static observedAttributes = ["home-href", "seminars-href", "current"];

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      this.render();
    }
  }

  render() {
    this.innerHTML = createSiteHeaderMarkup({
      homeHref: this.getAttribute("home-href") ?? "./index.html",
      seminarsHref:
        this.getAttribute("seminars-href") ?? "./pages/seminars/",
      current: this.getAttribute("current") ?? "",
    });
  }
}

if (globalThis.customElements && !customElements.get("site-header")) {
  customElements.define("site-header", SiteHeader);
}
