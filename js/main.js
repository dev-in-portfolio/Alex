// ===== PRELOADER =====
window.addEventListener('load', () => {
  const p = document.getElementById('preloader');
  if (p) {
    p.classList.add('hidden');
    setTimeout(() => p.remove(), 1000);
    setTimeout(() => fireworkBurst(12), 500);
  }
});

// ===== SOUND EFFECTS (Web Audio API) =====
(function initSFX() {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  window.playHover = function() {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.type = 'sine';
      o.frequency.value = 1200 + Math.random() * 400;
      g.gain.setValueAtTime(0.015, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
      o.start(c.currentTime);
      o.stop(c.currentTime + 0.08);
    } catch(e) {}
  };

  window.playClick = function() {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(800, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.06);
      g.gain.setValueAtTime(0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
      o.start(c.currentTime);
      o.stop(c.currentTime + 0.1);
    } catch(e) {}
  };

  window.playBeat = function() {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.type = 'sine';
      o.frequency.value = 60;
      g.gain.setValueAtTime(0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      o.start(c.currentTime);
      o.stop(c.currentTime + 0.15);
    } catch(e) {}
  };

  // Attach to interactive elements
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('a, button, .gallery-item, .roast-card, .song-item, .ctrl-btn, .ss-btn, .dot');
    if (t) window.playHover();
  });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('a, button, .gallery-item, .ctrl-btn, .ss-btn, .song-item');
    if (t) window.playClick();
  });
})();

// ===== THREE.JS AUDIO-REACTIVE 3D SCENE =====
// Global audio data channel for scene reactivity
window.sceneAudio = { data: null, energy: 0, bass: 0, beat: false };

(function initThree() {
  // Check if Three.js loaded
  if (typeof THREE === 'undefined') {
    // Retry after CDN loads
    let attempts = 0;
    const retry = setInterval(() => {
      if (typeof THREE !== 'undefined') { clearInterval(retry); initScene(); }
      if (++attempts > 20) clearInterval(retry);
    }, 200);
    return;
  }
  initScene();

  function initScene() {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030303, 0.0018);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 28);
    const targetCamPos = { x: 0, y: 1, z: 28 };
    const camHome = { x: 0, y: 1, z: 28 };

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // === PARTICLES ===
    const particleCount = 800;
    const pos = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const basePos = new Float32Array(particleCount * 3); // store original
    const colors = new Float32Array(particleCount * 3);
    const particleSpeeds = [];
    for (let i = 0; i < particleCount; i++) {
      const r = 8 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      pos[i * 3] = basePos[i * 3] = x;
      pos[i * 3 + 1] = basePos[i * 3 + 1] = y;
      pos[i * 3 + 2] = basePos[i * 3 + 2] = z;
      sizes[i] = 0.3 + Math.random() * 2;
      const gold = 0xd4af37;
      colors[i * 3] = ((gold >> 16) & 0xff) / 255;
      colors[i * 3 + 1] = ((gold >> 8) & 0xff) / 255;
      colors[i * 3 + 2] = (gold & 0xff) / 255;
      particleSpeeds.push(0.2 + Math.random() * 0.5);
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      vertexColors: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // === TORUS KNOT ===
    const knotGeo = new THREE.TorusKnotGeometry(2.2, 0.7, 180, 20);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd4af37,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.35,
      clearcoat: 0.3,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    scene.add(knot);

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const wireKnot = new THREE.Mesh(knotGeo.clone(), wireMat);
    wireKnot.scale.set(1.03, 1.03, 1.03);
    scene.add(wireKnot);

    // === ORBITING SHAPES ===
    const shapes = [];
    const sColors = [0xd4af37, 0xf5e6a3, 0xb8860b, 0xffd700, 0xc9a84c, 0xffc107];
    for (let i = 0; i < 12; i++) {
      const isOcta = Math.random() > 0.4;
      const sGeo = isOcta
        ? new THREE.OctahedronGeometry(0.25 + Math.random() * 0.3)
        : new THREE.IcosahedronGeometry(0.2 + Math.random() * 0.25);
      const sMat = new THREE.MeshPhysicalMaterial({
        color: sColors[i % sColors.length],
        metalness: 0.85,
        roughness: 0.2,
        emissive: sColors[i % sColors.length],
        emissiveIntensity: 0.08,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(sGeo, sMat);
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const r = 4.5 + Math.random() * 5;
      mesh.userData = { angle: a, radius: r, speed: 0.15 + Math.random() * 0.4, yOff: (Math.random() - 0.5) * 7, baseScale: 0.8 + Math.random() * 0.4 };
      scene.add(mesh);
      shapes.push(mesh);
    }

    // === PARTICLE TEXT for "35" ===
    // Pre-define "35" as a set of 2D points (approximate)
    const textPoints = [];
    function generateTextPoints() {
      // "3" shape
      const p3 = [
        // Top horizontal
        [-1.8, 1.8], [-1.2, 1.8], [-0.6, 1.8],
        // Top curve
        [-1.8, 1.2], [-1.8, 0.6],
        // Middle horizontal  
        [-1.2, 0], [-0.6, 0],
        // Bottom curve
        [-1.8, -0.6], [-1.8, -1.2],
        // Bottom horizontal
        [-1.8, -1.8], [-1.2, -1.8], [-0.6, -1.8],
        // Vertical connectors
        [-1.8, 1.5], [-1.8, 0.9], [-1.8, 0.3], [-1.8, -0.3], [-1.8, -0.9], [-1.8, -1.5],
      ];
      // "5" shape
      const p5 = [
        [-0.2, 1.8], [0.4, 1.8], [1.0, 1.8],
        [-0.2, 1.2], [-0.2, 0.6],
        [-0.2, 0], [0.4, 0], [1.0, 0],
        [1.0, -0.6], [1.0, -1.2],
        [-0.2, -1.8], [0.4, -1.8], [1.0, -1.8],
        [0.4, -0.6], [0.4, -1.2],
      ];
      // "✦" 
      const star = [
        [1.8, 1.8], [1.4, 1.4], [2.2, 1.4], [1.8, 1.0],
        [1.8, 0.6], [1.4, 1.0], [2.2, 1.0],
        [1.8, -0.2], [1.4, 0.2], [2.2, 0.2],
        [1.8, -0.6], [1.4, -0.2], [2.2, -0.2],
      ];
      return [...p3, ...p5, ...star];
    }

    const textPositions = generateTextPoints();
    const particleTextTargets = new Float32Array(particleCount * 3);
    // Assign each particle a target position in the text, or keep it floating
    const assignText = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      if (i < textPositions.length) {
        const t = textPositions[i];
        particleTextTargets[i * 3] = t[0] * 0.8;
        particleTextTargets[i * 3 + 1] = t[1] * 0.8;
        particleTextTargets[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        assignText[i] = 1;
      } else {
        assignText[i] = 0;
      }
    }

    let textFormed = false;
    let textFormTimer = 0;

    // Mouse tracking
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    let time = 0;
    let beatFlash = 0;

    // Expose scene globally for audio reactivity
    window.__scene = { scene, camera, renderer, particles, knot, wireKnot, shapes, pos, basePos, particleTextTargets, assignText, pMat, textFormed };

    function animate() {
      requestAnimationFrame(animate);
      time += 0.005;
      beatFlash = Math.max(0, beatFlash - 0.02);

      // ===== AUDIO REACTIVITY =====
      let energy = 0, bass = 0, beat = false;
      if (window.sceneAudio && window.sceneAudio.data) {
        const d = window.sceneAudio.data;
        let sum = 0, bassSum = 0;
        for (let i = 0; i < d.length; i++) {
          sum += d[i];
          if (i < 10) bassSum += d[i];
        }
        energy = sum / d.length / 255;
        bass = bassSum / 10 / 255;
        beat = window.sceneAudio.beat;

        if (beat) {
          beatFlash = 1;
          knotMat.emissiveIntensity = 0.6;
          pMat.size = 0.25;
        } else {
          knotMat.emissiveIntensity = 0.1 + bass * 0.5;
          pMat.size = 0.12 + bass * 0.15;
        }

        // Torus knot rotation speed = f(energy)
        const speedMul = 0.005 + energy * 0.025;
        knot.rotation.x += speedMul;
        knot.rotation.y += speedMul * 1.3;
        wireKnot.rotation.x = knot.rotation.x;
        wireKnot.rotation.y = knot.rotation.y;

        // Torus knot scale pulse
        const scale = 1 + bass * 0.15;
        knot.scale.set(scale, scale, scale);
        wireKnot.scale.set(scale * 1.03, scale * 1.03, scale * 1.03);

        // Particle opacity
        pMat.opacity = 0.5 + energy * 0.4;
      } else {
        knot.rotation.x += 0.004;
        knot.rotation.y += 0.006;
        wireKnot.rotation.x = knot.rotation.x;
        wireKnot.rotation.y = knot.rotation.y;
        knot.scale.set(1, 1, 1);
        wireKnot.scale.set(1.03, 1.03, 1.03);
        pMat.opacity = 0.7;
        pMat.size = 0.15;
        knotMat.emissiveIntensity = 0.15;
      }

      // ===== PARTICLE TEXT FORMATION =====
      const posAttr = particles.geometry.attributes.position;
      const pArray = posAttr.array;

      if (!textFormed && time > 2) {
        textFormTimer += 0.005;
        const progress = Math.min(1, textFormTimer / 3);
        for (let i = 0; i < particleCount; i++) {
          if (assignText[i]) {
            pArray[i * 3] += (particleTextTargets[i * 3] - pArray[i * 3]) * 0.02 * progress;
            pArray[i * 3 + 1] += (particleTextTargets[i * 3 + 1] - pArray[i * 3 + 1]) * 0.02 * progress;
            pArray[i * 3 + 2] += (particleTextTargets[i * 3 + 2] - pArray[i * 3 + 2]) * 0.02 * progress;
          }
        }
        if (progress >= 1) textFormed = true;
      }

      // If text is formed and audio energy is high, slightly excite the text particles
      if (textFormed && energy > 0.3) {
        for (let i = 0; i < particleCount; i++) {
          if (assignText[i]) {
            pArray[i * 3 + 2] += (Math.random() - 0.5) * energy * 0.2;
            pArray[i * 3 + 2] *= 0.95;
          }
        }
      }

      posAttr.needsUpdate = true;

      // ===== ORBITING SHAPES =====
      const bassMod = bass || 0;
      shapes.forEach((mesh) => {
        const { speed, yOff, baseScale } = mesh.userData;
        mesh.userData.angle += (speed + bassMod * 0.3) * 0.008;
        const rad = mesh.userData.radius + Math.sin(time * 0.5 + mesh.userData.angle) * 0.3;
        mesh.position.x = Math.cos(mesh.userData.angle) * rad;
        mesh.position.z = Math.sin(mesh.userData.angle) * rad;
        mesh.position.y = yOff + Math.sin(time * speed + mesh.userData.angle) * 1.5;
        const s = baseScale + bassMod * 0.2;
        mesh.scale.set(s, s, s);
        mesh.rotation.x += 0.015 + energy * 0.03;
        mesh.rotation.y += 0.02 + energy * 0.04;
        mesh.material.opacity = 0.3 + bassMod * 0.5;
        mesh.material.emissiveIntensity = 0.05 + bassMod * 0.3;
      });

      // ===== CAMERA FLY-THROUGH ON LOAD =====
      if (time < 3) {
        const t = time / 3;
        camera.position.x = Math.sin(t * Math.PI * 0.5) * 5;
        camera.position.y = 1 + Math.sin(t * Math.PI) * 2;
        camera.position.z = 28 - t * 5;
      } else {
        // Mouse follow
        targetCamPos.x = mouseX * 2.5;
        targetCamPos.y = 1 + -mouseY * 1.8;
        camera.position.x += (targetCamPos.x - camera.position.x) * 0.02;
        camera.position.y += (targetCamPos.y - camera.position.y) * 0.02;
        camera.position.z = camHome.z;
      }
      camera.lookAt(0, 0, 0);

      // ===== BEAT FLASH =====
      if (beatFlash > 0) {
        pMat.opacity = Math.min(1, pMat.opacity + 0.3);
        renderer.toneMappingExposure = 1.2 + beatFlash * 0.5;
      } else {
        renderer.toneMappingExposure += (1.2 - renderer.toneMappingExposure) * 0.02;
      }

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
})();

// ===== BEAT DETECTION ENGINE =====
// dj.js will set window.sceneAudio.data (Uint8Array)
// This engine detects beats from the data
(function beatDetection() {
  let prevBass = 0;
  const threshold = 0.15;
  let cooldown = 0;

  setInterval(() => {
    if (!window.sceneAudio || !window.sceneAudio.data) return;
    const d = window.sceneAudio.data;
    let bassSum = 0;
    for (let i = 0; i < 10; i++) bassSum += d[i];
    const bass = bassSum / 10 / 255;
    const diff = bass - prevBass;
    window.sceneAudio.bass = bass;
    window.sceneAudio.energy = bassSum / 10 / 255;
    cooldown = Math.max(0, cooldown - 1);

    if (diff > threshold && cooldown === 0 && bass > 0.2) {
      window.sceneAudio.beat = true;
      cooldown = 15;
      window.playBeat();
      setTimeout(() => { window.sceneAudio.beat = false; }, 50);
    } else {
      // Only set false if enough time passed
    }
    prevBass = bass;
  }, 50);
})();

// ===== SPARKLE CURSOR TRAIL =====
(function sparkleCursor() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const trails = [];
  const COLORS = ['#D4AF37', '#F5E6A3', '#FFD700', '#FFF3CD', '#FFC107'];

  document.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 3; i++) {
      trails.push({
        x: e.clientX + (Math.random() - 0.5) * 12,
        y: e.clientY + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        life: 1, size: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    if (trails.length > 200) trails.splice(0, trails.length - 200);
  });

  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i]; t.x += t.vx; t.y += t.vy; t.life -= 0.015;
      t.vx *= 0.98; t.vy *= 0.98;
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
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      if (dist > 100) return;
      const str = (1 - dist / 100) * 8;
      el.style.transform = `translate(${x / 100 * str}px, ${y / 100 * str}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();

// ===== FIREWORKS =====
(function initFireworks() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const COLORS = ['#D4AF37', '#F5E6A3', '#FFD700', '#C9A84C', '#FFC107', '#FFF3CD', '#B8860B', '#FF6B35'];

  class Spark {
    constructor(x, y) {
      this.x = x; this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 2;
      this.gravity = 0.06 + Math.random() * 0.04;
      this.life = 1; this.decay = 0.008 + Math.random() * 0.012;
      this.size = 2 + Math.random() * 3;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.trail = [];
    }
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 6) this.trail.shift();
      this.vx *= 0.98; this.vy += this.gravity;
      this.x += this.vx; this.y += this.vy;
      this.life -= this.decay;
    }
    draw() {
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.size * 0.3 * (i / this.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = (this.life * (i / this.trail.length)) * 0.3;
        ctx.fill();
      }
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
    for (let b = 0; b < count; b++) {
      const x = W * 0.1 + Math.random() * W * 0.8;
      const y = H * 0.1 + Math.random() * H * 0.35;
      const n = 40 + Math.floor(Math.random() * 60);
      for (let j = 0; j < n; j++) sparks.push(new Spark(x, y));
    }
  };

  document.addEventListener('click', () => fireworkBurst(6));

  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].update(); sparks[i].draw();
      if (sparks[i].life <= 0) sparks.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    if (sparks.length > 0) requestAnimationFrame(animate);
  }

  (function loop() { if (sparks.length > 0) animate(); requestAnimationFrame(loop); })();
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
      el.textContent = current.substring(0, charIdx + 1); charIdx++;
      if (charIdx === current.length) { isDeleting = true; speed = 2000; } else speed = 40 + Math.random() * 50;
    } else {
      el.textContent = current.substring(0, charIdx); charIdx--;
      if (charIdx < 0) { isDeleting = false; idx = (idx + 1) % phrases.length; speed = 500; } else speed = 20 + Math.random() * 30;
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
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

// ===== PAGE TRANSITIONS =====
(function pageTransitions() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99995;background:#030303;pointer-events:none;transform:scaleY(0);transform-origin:top;transition:transform 0.6s cubic-bezier(0.65,0,0.35,1)';
  document.body.appendChild(overlay);

  document.querySelectorAll('a[href]:not([target])').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript')) return;
    a.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      overlay.style.transform = 'scaleY(1)';
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
  window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 80));
  toggle?.addEventListener('click', () => links?.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => links?.classList.remove('open')));
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page || (page === '' && a.getAttribute('href') === 'index.html')) a.classList.add('active');
  });
})();
