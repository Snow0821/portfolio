class SectionInclude extends HTMLElement {
  async connectedCallback() {
    const source = this.getAttribute("src");

    if (!source) {
      this.showError("불러올 섹션이 지정되지 않았습니다.");
      return;
    }

    try {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const template = document.createElement("template");
      template.innerHTML = (await response.text()).trim();

      const section = template.content.firstElementChild;
      const hasSingleSection =
        section?.tagName === "SECTION" &&
        template.content.children.length === 1;

      if (!hasSingleSection) {
        throw new Error("섹션 파일의 최상위 요소는 하나의 <section>이어야 합니다.");
      }

      this.replaceWith(section);
    } catch (error) {
      console.error(`섹션을 불러오지 못했습니다: ${source}`, error);
      this.showError("이 섹션을 불러오지 못했습니다.");
    }
  }

  showError(message) {
    const section = document.createElement("section");
    section.setAttribute("role", "alert");
    section.textContent = message;
    this.replaceWith(section);
  }
}

customElements.define("section-include", SectionInclude);
