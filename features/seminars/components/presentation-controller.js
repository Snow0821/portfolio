export class PresentationController {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.container = documentRef.querySelector(".slide-container.horizontal");
    if (!this.container) return;

    this.slides = Array.from(this.container.querySelectorAll(".slide-card"));
    this.totalSlides = this.slides.length;
    this.currentIndex = 0;

    this.bindEvents();
    this.setupObserver();
  }

  bindEvents() {
    this.document.addEventListener("keydown", (event) => this.handleKeyDown(event));
  }

  handleKeyDown(event) {
    if (event.target?.closest?.("a, button, input, textarea, select")) return;
    if (["ArrowRight", "ArrowDown", " "].includes(event.key)) {
      event.preventDefault();
      this.navigate(1);
    } else if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      this.navigate(-1);
    }
  }

  navigate(direction) {
    const targetIndex = this.currentIndex + direction;
    if (targetIndex >= 0 && targetIndex < this.totalSlides) this.scrollToIndex(targetIndex);
  }

  scrollToIndex(index) {
    const targetSlide = this.slides[index];
    if (!targetSlide) return;
    targetSlide.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
    this.currentIndex = index;
  }

  setupObserver() {
    if (!globalThis.IntersectionObserver) return;
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = this.slides.indexOf(entry.target);
        if (index !== -1 && index !== this.currentIndex) {
          this.currentIndex = index;
        }
      }
    }, { root: this.container, threshold: 0.5 });
    for (const slide of this.slides) this.observer.observe(slide);
  }
}
