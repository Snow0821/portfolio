import { escapeAttribute, escapeHtml } from "../../utils/html.js";

const BaseElement = globalThis.HTMLElement ?? class {};

export function createSlideHeaderMarkup({
  title = "",
  badge = "",
  badgeClass = "",
  backHref = "../seminars/",
  altHref = "#",
  altText = "다른 모드로 보기 ↗",
  isPresentation = true,
} = {}) {
  const safeBadgeClass = String(badgeClass).replace(/[^a-z0-9_-]/gi, "");

  return `
    <header class="slide-header">
      <div class="slide-header-left">
        <a href="${escapeAttribute(backHref)}" class="slide-back-btn" title="세미나 목록으로 이동">← Seminars</a>
        <h1 class="slide-title-text">${escapeHtml(title)}</h1>
        ${badge ? `<span class="slide-badge${safeBadgeClass ? ` ${safeBadgeClass}` : ""}">${escapeHtml(badge)}</span>` : ""}
      </div>
      <div class="slide-header-right">
        <a href="${escapeAttribute(altHref)}" class="slide-action-btn" title="${escapeAttribute(altText)}">
          <span>${escapeHtml(altText)}</span>
        </a>
        ${
          isPresentation
            ? `<span id="slide-counter" class="slide-counter">1 / 1</span>
               <div class="slide-nav-btns">
                 <button type="button" id="prev-slide" class="slide-nav-btn" aria-label="이전 슬라이드">‹</button>
                 <button type="button" id="next-slide" class="slide-nav-btn" aria-label="다음 슬라이드">›</button>
               </div>`
            : ""
        }
      </div>
    </header>
  `;
}

export class SlideHeader extends BaseElement {
  static observedAttributes = [
    "title",
    "badge",
    "badge-class",
    "back-href",
    "alt-href",
    "alt-text",
    "is-presentation",
  ];

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      this.render();
    }
  }

  render() {
    this.innerHTML = createSlideHeaderMarkup({
      title: this.getAttribute("title") ?? "",
      badge: this.getAttribute("badge") ?? "",
      badgeClass: this.getAttribute("badge-class") ?? "",
      backHref: this.getAttribute("back-href") ?? "../seminars/",
      altHref: this.getAttribute("alt-href") ?? "#",
      altText: this.getAttribute("alt-text") ?? "다른 모드로 보기 ↗",
      isPresentation: this.getAttribute("is-presentation") !== "false",
    });
  }
}

if (globalThis.customElements && !customElements.get("slide-header")) {
  customElements.define("slide-header", SlideHeader);
}
