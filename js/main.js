// ===== PRELOADER =====
window.addEventListener('load', () => {
  const p = document.getElementById('preloader');
  if (p) {
    p.classList.add('hidden');
    setTimeout(() => p.remove(), 1000);
    setTimeout(() => fireworkBurst(8), 400);
  }
});

// ===== THREE.JS 3D BACKGROUND =====
(function initThree() {
  const canvas = document.getElementById('canvas-bg');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030303, 0.002);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 25;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // === Particles ===
  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const r = 15 + Math.random() * 25;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.5 + Math.random() * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xd4af37,
    size: 0.12,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // === Torus Knot ===
  const knotGeo = new THREE.TorusKnotGeometry(1.8, 0.6, 128, 16);
  const knotMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0xd4af37,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.3,
    wireframe: false,
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  knot.position.set(0, 0, 0);
  scene.add(knot);

  // Torus knot wireframe overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xd4af37,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });
  const wireKnot = new THREE.Mesh(knotGeo.clone(), wireMat);
  wireKnot.scale.set(1.02, 1.02, 1.02);
  scene.add(wireKnot);

  // === Orbiting small shapes ===
  const shapes = [];
  const shapeColors = [0xd4af37, 0xf5e6a3, 0xb8860b, 0xffd700];
  for (let i = 0; i < 8; i++) {
    const sGeo = Math.random() > 0.5
      ? new THREE.OctahedronGeometry(0.3 + Math.random() * 0.3)
      : new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.25);
    const sMat = new THREE.MeshPhysicalMaterial({
      color: shapeColors[i % shapeColors.length],
      metalness: 0.8,
      roughness: 0.3,
      emissive: shapeColors[i % shapeColors.length],
      emissiveIntensity: 0.05,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new THREE.Mesh(sGeo, sMat);
    const angle = (i / 8) * Math.PI * 2;
    const radius = 5 + Math.random() * 4;
    mesh.userData = { angle, radius, speed: 0.2 + Math.random() * 0.3, yOffset: (Math.random() - 0.5) * 6 };
    scene.add(mesh);
    shapes.push(mesh);
  }

  // Mouse tracking
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    // Rotate particle field
    particles.rotation.y += 0.0004;
    particles.rotation.x += 0.0001;

    // Rotate center knot
    knot.rotation.x += 0.005;
    knot.rotation.y += 0.008;
    wireKnot.rotation.x = knot.rotation.x;
    wireKnot.rotation.y = knot.rotation.y;

    // Animate orbiting shapes
    shapes.forEach((mesh) => {
      const { angle, radius, speed, yOffset } = mesh.userData;
      mesh.userData.angle += speed * 0.008;
      mesh.position.x = Math.cos(mesh.userData.angle) * radius;
      mesh.position.z = Math.sin(mesh.userData.angle) * radius;
      mesh.position.y = yOffset + Math.sin(time * speed + angle) * 2;
      mesh.rotation.x += 0.02;
      mesh.rotation.y += 0.03;
    });

    // Camera follow mouse
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// ===== GSAP ANIMATIONS =====
(function initGSAP() {
  if (typeof gsap === 'undefined') return;

  // Hero text stagger
  const heroSpans = document.querySelectorAll('.hero h1 .line span');
  if (heroSpans.length) {
    const tl = gsap.timeline({ delay: 0.3 });
    tl.to(heroSpans, {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
    });
  }

  // Hero badge pulse
  gsap.to('.hero-badge .dot', {
    scale: 1.5,
    opacity: 0.3,
    duration: 1.2,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
  });

  // Roast cards stagger with ScrollTrigger
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.utils.toArray('.roast-card').forEach((card, i) => {
      gsap.from(card, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Gallery items stagger
    gsap.utils.toArray('.gallery-item').forEach((item, i) => {
      gsap.from(item, {
        y: 50,
        opacity: 0,
        scale: 0.95,
        duration: 0.7,
        delay: i * 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Section headers
    gsap.utils.toArray('.section-header').forEach((h) => {
      gsap.from(h, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: h, start: 'top 80%' },
      });
    });

    // Page header
    gsap.utils.toArray('.page-header').forEach((h) => {
      gsap.from(h, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: h, start: 'top 80%' },
      });
    });

    // DJ player and songs panel
    gsap.utils.toArray('.dj-player, .songs-panel').forEach((el) => {
      gsap.from(el, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });
  }

  // Typewriter handled separately in the typewriter function

  // Continuous hero glow
  gsap.to('.hero h1 .line:first-child', {
    filter: 'brightness(1.15)',
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
})();

// ===== SPARKLE CURSOR TRAIL =====
(function sparkleCursor() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9998';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const trails = [];
  const COLORS = ['#D4AF37', '#F5E6A3', '#FFD700', '#FFF3CD', '#FFC107'];

  document.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 3; i++) {
      trails.push({
        x: e.clientX + (Math.random() - 0.5) * 10,
        y: e.clientY + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        life: 1,
        size: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    if (trails.length > 200) trails.splice(0, trails.length - 200);
  });

  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.x += t.vx;
      t.y += t.vy;
      t.life -= 0.015;
      t.vx *= 0.98;
      t.vy *= 0.98;
      if (t.life <= 0) { trails.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.life * 0.6;
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = t.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  animate();
})();

// ===== MAGNETIC BUTTONS =====
(function magnetic() {
  document.querySelectorAll('.btn, .ctrl-btn, .ss-btn, .nav-links a, .song-item').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      const maxDist = 100;
      if (dist > maxDist) return;
      const strength = (1 - dist / maxDist) * 8;
      el.style.transform = `translate(${x / maxDist * strength}px, ${y / maxDist * strength}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

// ===== FIREWORKS =====
(function initFireworks() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#D4AF37', '#F5E6A3', '#FFD700', '#C9A84C', '#FFC107', '#FFF3CD', '#B8860B', '#FF6B35'];

  class Spark {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 2;
      this.gravity = 0.06 + Math.random() * 0.04;
      this.life = 1;
      this.decay = 0.008 + Math.random() * 0.012;
      this.size = 2 + Math.random() * 3;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.trail = [];
    }
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 5) this.trail.shift();
      this.vx *= 0.98;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
    }
    draw() {
      // Trail
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.size * 0.3 * (i / this.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = (this.life * (i / this.trail.length)) * 0.3;
        ctx.fill();
      }
      // Main spark
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.life * 0.8;
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  let sparks = [];

  window.fireworkBurst = function(count = 12) {
    for (let i = 0; i < count; i++) {
      const x = W * 0.2 + Math.random() * W * 0.6;
      const y = H * 0.15 + Math.random() * H * 0.3;
      const n = 40 + Math.floor(Math.random() * 60);
      for (let j = 0; j < n; j++) sparks.push(new Spark(x, y));
    }
  };

  document.addEventListener('click', () => fireworkBurst(8));

  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].update();
      sparks[i].draw();
      if (sparks[i].life <= 0) sparks.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    if (sparks.length > 0) requestAnimationFrame(animate);
  }

  // Start animation loop
  function loop() {
    if (sparks.length > 0) animate();
    requestAnimationFrame(loop);
  }
  loop();
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
  let idx = 0, charIdx = 0, isDeleting = false, speed = 60;

  function tick() {
    const current = phrases[idx];
    if (!isDeleting) {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) { isDeleting = true; speed = 2000; }
      else speed = 40 + Math.random() * 50;
    } else {
      el.textContent = current.substring(0, charIdx);
      charIdx--;
      if (charIdx < 0) { isDeleting = false; idx = (idx + 1) % phrases.length; speed = 500; }
      else speed = 20 + Math.random() * 30;
    }
    setTimeout(tick, speed);
  }
  tick();
})();

// ===== 3D TILT CARDS =====
(function tiltCards() {
  document.querySelectorAll('.roast-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${y * -10}deg) rotateY(${x * 10}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
})();

// ===== PAGE TRANSITIONS =====
(function pageTransitions() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99995;
    background: #030303; pointer-events: none;
    transform: scaleY(0); transform-origin: top;
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  `;
  document.body.appendChild(overlay);

  document.querySelectorAll('a[href]:not([target])').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript')) return;
    a.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      overlay.style.transform = 'scaleY(1)';
      overlay.style.transformOrigin = 'top';
      setTimeout(() => { window.location.href = href; }, 600);
    });
  });

  window.addEventListener('pageshow', () => {
    overlay.style.transform = 'scaleY(0)';
    overlay.style.transformOrigin = 'bottom';
  });
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

  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });
})();
