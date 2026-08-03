class SlideController {
  constructor() {
    this.container = document.querySelector('.slide-container');
    this.printBtn = document.getElementById('print-pdf');

    // Bind PDF Print trigger
    if (this.printBtn) {
      this.printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    if (!this.container) return;

    this.isHorizontal = this.container.classList.contains('horizontal');
    this.slides = Array.from(this.container.querySelectorAll('.slide-card'));
    this.totalSlides = this.slides.length;
    this.currentIndex = 0;

    this.counterEl = document.getElementById('slide-counter');
    this.prevBtn = document.getElementById('prev-slide');
    this.nextBtn = document.getElementById('next-slide');

    this.init();
  }

  init() {
    this.updateUI();
    this.bindEvents();
    this.setupObserver();
  }

  bindEvents() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Button controls
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.navigate(-1));
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.navigate(1));
    }
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      this.navigate(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.navigate(-1);
    }
  }

  navigate(direction) {
    const targetIndex = this.currentIndex + direction;
    if (targetIndex >= 0 && targetIndex < this.totalSlides) {
      this.scrollToIndex(targetIndex);
    }
  }

  scrollToIndex(index) {
    const targetSlide = this.slides[index];
    if (targetSlide) {
      targetSlide.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'start'
      });
      this.currentIndex = index;
      this.updateUI();
    }
  }

  setupObserver() {
    const options = {
      root: this.container,
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = this.slides.indexOf(entry.target);
          if (index !== -1 && index !== this.currentIndex) {
            this.currentIndex = index;
            this.updateUI();
          }
        }
      });
    }, options);

    this.slides.forEach((slide) => observer.observe(slide));
  }

  updateUI() {
    if (this.counterEl) {
      this.counterEl.textContent = `${this.currentIndex + 1} / ${this.totalSlides}`;
    }

    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentIndex === 0;
    }

    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentIndex === this.totalSlides - 1;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SlideController();
});
