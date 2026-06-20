class AutoSlideshow {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.interval = options.interval || 4000;
    this.current = 0;
    this.timer = null;
    this.isPaused = false;

    this.track = this.container.querySelector('.slideshow-track');
    this.dots = this.container.querySelectorAll('.dot');
    this.prevBtn = this.container.querySelector('.slideshow-prev');
    this.nextBtn = this.container.querySelector('.slideshow-next');
    this.playPauseBtn = this.container.querySelector('.slideshow-play');

    this.slides = this.track?.querySelectorAll('.slideshow-slide');
    if (!this.slides?.length) return;

    this.init();
  }

  init() {
    this.goTo(0);
    this.startAuto();

    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.goTo(i);
        this.resetAuto();
      });
    });

    this.prevBtn?.addEventListener('click', () => {
      this.goTo(this.current - 1);
      this.resetAuto();
    });

    this.nextBtn?.addEventListener('click', () => {
      this.goTo(this.current + 1);
      this.resetAuto();
    });

    this.playPauseBtn?.addEventListener('click', () => {
      this.togglePause();
    });
  }

  goTo(index) {
    if (!this.track || !this.slides.length) return;
    this.current = ((index % this.slides.length) + this.slides.length) % this.slides.length;
    this.track.style.transform = `translateX(-${this.current * 100}%)`;
    this.dots.forEach((d, i) => d.classList.toggle('active', i === this.current));
  }

  startAuto() {
    this.stopAuto();
    this.timer = setInterval(() => this.goTo(this.current + 1), this.interval);
  }

  stopAuto() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  resetAuto() {
    if (!this.isPaused) this.startAuto();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.stopAuto();
      if (this.playPauseBtn) this.playPauseBtn.textContent = '▶';
    } else {
      this.startAuto();
      if (this.playPauseBtn) this.playPauseBtn.textContent = '❚❚';
    }
  }
}
