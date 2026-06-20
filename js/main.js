// ===== PRELOADER =====
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => preloader.remove(), 1000);
  }
});

// ===== CUSTOM CURSOR =====
(function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
  });

  function lerp() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;
    requestAnimationFrame(lerp);
  }
  lerp();

  document.querySelectorAll('a, button, .gallery-item, .roast-card, .song-item, .ctrl-btn, .ss-btn')
    .forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
})();

// ===== CANVAS PARTICLE BACKGROUND =====
(function initParticles() {
  const canvas = document.getElementById('canvas-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const COUNT = 120;
  const GOLD = '212, 175, 55';
  const CONNECT_DIST = 120;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.r = 1.2 + Math.random() * 1.8;
      this.alpha = 0.3 + Math.random() * 0.5;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${GOLD}, ${this.alpha})`;
      ctx.fill();
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${GOLD}, ${this.alpha * 0.5})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  let mouseX = -999, mouseY = -999;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${GOLD}, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function mouseInteraction() {
    for (const p of particles) {
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150 * 0.3;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
      p.vx *= 0.99;
      p.vy *= 0.99;
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.update();
      p.draw();
    }
    drawConnections();
    mouseInteraction();
    requestAnimationFrame(animate);
  }
  animate();
})();

// ===== CONFETTI =====
(function initConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pieces = [], active = false;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#D4AF37', '#F5E6A3', '#FFD700', '#C9A84C', '#FFC107', '#FFF3CD', '#B8860B'];

  class ConfettiPiece {
    constructor() {
      this.x = Math.random() * W;
      this.y = -20;
      this.w = 5 + Math.random() * 8;
      this.h = 3 + Math.random() * 5;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = 1 + Math.random() * 3;
      this.rot = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 6;
      this.opacity = 0.8 + Math.random() * 0.2;
    }
    update() {
      this.x += this.vx;
      this.vy += 0.04;
      this.y += this.vy;
      this.rot += this.rotSpeed;
      this.opacity -= 0.001;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      ctx.restore();
    }
  }

  let burstCount = 0;
  function burst() {
    for (let i = 0; i < 80; i++) pieces.push(new ConfettiPiece());
    burstCount++;
    active = true;
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (let i = pieces.length - 1; i >= 0; i--) {
      pieces[i].update();
      pieces[i].draw();
      if (pieces[i].y > H + 20 || pieces[i].opacity <= 0) {
        pieces.splice(i, 1);
      }
    }
    if (pieces.length === 0) active = false;
    else requestAnimationFrame(animate);
  }

  // Trigger confetti after preloader
  setTimeout(() => { burst(); animate(); }, 800);

  // Trigger on click anywhere (with some debounce)
  document.addEventListener('click', () => {
    if (!active) { burst(); animate(); }
  });
})();

// ===== TYPEWRITER =====
(function typewriter() {
  const el = document.getElementById('typewriter-text');
  if (!el) return;
  const phrases = [
    '35 years of questionable decisions.',
    'Level 35: still no manual.',
    'Aged to perfection... mostly.',
    'Professionally not a grown-up.',
    '35 candles = fire hazard.',
  ];
  let idx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let speed = 60;

  function tick() {
    const current = phrases[idx];
    if (!isDeleting) {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        isDeleting = true;
        speed = 2000;
      } else {
        speed = 40 + Math.random() * 50;
      }
    } else {
      el.textContent = current.substring(0, charIdx);
      charIdx--;
      if (charIdx < 0) {
        isDeleting = false;
        idx = (idx + 1) % phrases.length;
        speed = 500;
      } else {
        speed = 20 + Math.random() * 30;
      }
    }
    setTimeout(tick, speed);
  }
  tick();
})();

// ===== 3D TILT ON CARDS =====
(function tiltCards() {
  const cards = document.querySelectorAll('.roast-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
})();

// ===== SCROLL REVEAL =====
(function scrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .gallery-item')
    .forEach(el => observer.observe(el));
})();

// ===== NAVBAR =====
(function navbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 80);
  });

  toggle?.addEventListener('click', () => links?.classList.toggle('open'));

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => links?.classList.remove('open'));
  });

  // Active link
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ===== HERO TEXT SPLIT ANIMATION =====
(function heroText() {
  const lines = document.querySelectorAll('.hero h1 .line span');
  if (!lines.length) return;
  lines.forEach((span, i) => {
    setTimeout(() => {
      span.style.transform = 'translateY(0)';
      span.style.opacity = '1';
      span.style.transition = `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.15}s`;
    }, 300);
  });
})();
