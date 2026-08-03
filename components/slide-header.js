class SlideHeader extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute("title") || "";
    const badge = this.getAttribute("badge") || "";
    const badgeClass = this.getAttribute("badge-class") ? ` ${this.getAttribute("badge-class")}` : "";
    const altHref = this.getAttribute("alt-href") || "#";
    const altText = this.getAttribute("alt-text") || "다른 모드로 보기 ↗";
    const isPresentation = this.getAttribute("is-presentation") !== "false";

    this.innerHTML = `
      <header class="slide-header">
        <div class="slide-header-left">
          <a href="../seminar.html" class="slide-back-btn" title="세미나 목록으로 이동">← Seminars</a>
          <h1 class="slide-title-text">${title}</h1>
          ${badge ? `<span class="slide-badge${badgeClass}">${badge}</span>` : ""}
        </div>
        <div class="slide-header-right">
          <a href="${altHref}" class="slide-action-btn" title="${altText}">
            <span>${altText}</span>
          </a>
          ${
            isPresentation
              ? `<span id="slide-counter" class="slide-counter">1 / 1</span>
                 <div class="slide-nav-btns">
                   <button id="prev-slide" class="slide-nav-btn" aria-label="이전 슬라이드">‹</button>
                   <button id="next-slide" class="slide-nav-btn" aria-label="다음 슬라이드">›</button>
                 </div>`
              : ""
          }
        </div>
      </header>
    `;
  }
}

customElements.define("slide-header", SlideHeader);
