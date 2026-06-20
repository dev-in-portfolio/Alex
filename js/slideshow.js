class KenBurnsSlideshow {
  constructor(id, opts = {}) {
    this.el = document.getElementById(id);
    if (!this.el) return;

    this.interval = opts.interval || 4000;
    this.current = 0;
    this.timer = null;
    this.paused = false;

    this.track = this.el.querySelector('.slideshow-track');
    this.dots = this.el.querySelectorAll('.dot');
    this.prevBtn = this.el.querySelector('.slideshow-prev');
    this.nextBtn = this.el.querySelector('.slideshow-next');
    this.playBtn = this.el.querySelector('.slideshow-play');
    this.slides = this.track?.querySelectorAll('.slideshow-slide');
    if (!this.slides?.length) return;

    this.init();
  }

  init() {
    this.slides.forEach((s, i) => {
      if (i === 0) s.classList.add('active');
    });

    this.goTo(0);
    this.startAuto();

    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { this.goTo(i); this.resetAuto(); });
    });

    this.prevBtn?.addEventListener('click', () => { this.goTo(this.current - 1); this.resetAuto(); });
    this.nextBtn?.addEventListener('click', () => { this.goTo(this.current + 1); this.resetAuto(); });
    this.playBtn?.addEventListener('click', () => this.togglePause());
  }

  goTo(index) {
    if (!this.track || !this.slides.length) return;
    this.slides.forEach(s => s.classList.remove('active'));
    this.current = ((index % this.slides.length) + this.slides.length) % this.slides.length;
    this.track.style.transform = `translateX(-${this.current * 100}%)`;
    this.dots.forEach((d, i) => d.classList.toggle('active', i === this.current));
    this.slides[this.current].classList.add('active');
  }

  startAuto() {
    this.stopAuto();
    this.timer = setInterval(() => this.goTo(this.current + 1), this.interval);
  }

  stopAuto() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  resetAuto() { if (!this.paused) this.startAuto(); }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) { this.stopAuto(); if (this.playBtn) this.playBtn.textContent = '▶'; }
    else { this.startAuto(); if (this.playBtn) this.playBtn.textContent = '❚❚'; }
  }
}
