class SectionInclude extends HTMLElement {
  async connectedCallback() {
    const source = this.getAttribute("src");

    if (!source) {
      this.showError("불러올 조각 파일이 지정되지 않았습니다.");
      return;
    }

    try {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const template = document.createElement("template");
      template.innerHTML = (await response.text()).trim();

      const firstChild = template.content.firstElementChild;
      if (!firstChild) {
        throw new Error("유효한 HTML 요소를 찾을 수 없습니다.");
      }

      this.replaceWith(template.content);
    } catch (error) {
      console.error(`조각을 불러오지 못했습니다: ${source}`, error);
      this.showError("이 내용을 불러오지 못했습니다.");
    }
  }

  showError(message) {
    const errorEl = document.createElement("div");
    errorEl.setAttribute("role", "alert");
    errorEl.style.padding = "1rem";
    errorEl.style.color = "var(--color-muted)";
    errorEl.textContent = message;
    this.replaceWith(errorEl);
  }
}

customElements.define("section-include", SectionInclude);
