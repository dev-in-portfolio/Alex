const songs = [
  { name: 'Happy Birthday (Gold Mix)', artist: 'Celebration Orchestra', file: '' },
  { name: '35 Vibes', artist: 'The Roast Masters', file: '' },
  { name: 'Birthday Dance', artist: 'Party Beats', file: '' },
  { name: 'Candles', artist: 'Gold Symphony', file: '' },
  { name: 'Epic Rise', artist: 'Cinematic Dreams', file: '' },
  { name: 'Funky 35', artist: 'Soul Brass', file: '' },
];

const demoUrls = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
];

const audio = new Audio();
let isPlaying = false;
let currentSong = -1;
let audioCtx = null;
let analyser = null;
let source = null;
let animFrame = null;

// DOM refs
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volumeSlider');
const songNameDisplay = document.getElementById('songNameDisplay');
const vinylDisc = document.querySelector('.vinyl-disc');
const strobe = document.querySelector('.vinyl-strobe');
const songListEl = document.getElementById('songList');

// === CIRCULAR VISUALIZER ===
const vizCanvas = document.getElementById('circularViz');
const vCtx = vizCanvas?.getContext('2d');

function setupVizCanvas() {
  if (!vizCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  const size = 260;
  vizCanvas.width = size * dpr;
  vizCanvas.height = size * dpr;
  vizCanvas.style.width = size + 'px';
  vizCanvas.style.height = size + 'px';
  vCtx.scale(dpr, dpr);
}

setupVizCanvas();
window.addEventListener('resize', setupVizCanvas);

// Pipe audio data to global scene for 3D reactivity
function pushAudioToScene() {
  if (!analyser) return;
  const bufferLength = analyser.frequencyBinCount;
  const data = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(data);
  window.sceneAudio.data = data;
}

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
}

function drawCircularViz() {
  if (!vCtx || !analyser || !vizCanvas) {
    animFrame = requestAnimationFrame(drawCircularViz);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 115;
  const innerR = 70;
  const midR = (outerR + innerR) / 2;

  vCtx.clearRect(0, 0, size, size);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const bars = 60;
  const step = Math.floor(bufferLength / bars);
  const angleStep = (Math.PI * 2) / bars;

  // Push audio data to 3D scene
  pushAudioToScene();

  // Glow ring
  const grad = vCtx.createRadialGradient(cx, cy, innerR - 5, cx, cy, outerR + 10);
  grad.addColorStop(0, 'rgba(212, 175, 55, 0.02)');
  grad.addColorStop(0.5, 'rgba(212, 175, 55, 0.05)');
  grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
  vCtx.beginPath();
  vCtx.arc(cx, cy, outerR + 10, 0, Math.PI * 2);
  vCtx.fillStyle = grad;
  vCtx.fill();

  // Draw bars
  for (let i = 0; i < bars; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += dataArray[i * step + j];
    const avg = sum / step;
    const pct = avg / 255;
    const barH = 5 + pct * 45;

    const angle = i * angleStep - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const x1 = cx + cos * innerR;
    const y1 = cy + sin * innerR;
    const x2 = cx + cos * (innerR + barH);
    const y2 = cy + sin * (innerR + barH);

    const t = i / bars;
    const r = Math.round(212 - t * 50);
    const g = Math.round(175 - t * 40);
    const b = Math.round(55 + t * 30);

    vCtx.beginPath();
    vCtx.moveTo(x1, y1);
    vCtx.lineTo(x2, y2);
    vCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + pct * 0.7})`;
    vCtx.lineWidth = 3.5;
    vCtx.lineCap = 'round';
    vCtx.shadowBlur = 8;
    vCtx.shadowColor = `rgba(${r}, ${g}, ${b}, ${pct * 0.5})`;
    vCtx.stroke();
    vCtx.shadowBlur = 0;
  }

  // Inner glow
  const ig = vCtx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  ig.addColorStop(0, 'rgba(212, 175, 55, 0.06)');
  ig.addColorStop(0.7, 'rgba(212, 175, 55, 0.03)');
  ig.addColorStop(1, 'rgba(212, 175, 55, 0)');
  vCtx.beginPath();
  vCtx.arc(cx, cy, innerR, 0, Math.PI * 2);
  vCtx.fillStyle = ig;
  vCtx.fill();

  animFrame = requestAnimationFrame(drawCircularViz);
}

function stopViz() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  if (vCtx) vCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
}

function playSong(index) {
  if (index < 0 || index >= songs.length) return;
  currentSong = index;
  audio.src = demoUrls[index];
  audio.load();
  audio.play().then(() => {
    isPlaying = true;
    initAudioContext();
    updateUI();
  }).catch(() => { isPlaying = false; updateUI(); });
  updateUI();
}

function togglePlay() {
  if (currentSong < 0) { playSong(0); return; }
  if (isPlaying) { audio.pause(); isPlaying = false; stopViz(); }
  else {
    audio.play().then(() => {
      isPlaying = true;
      if (!audioCtx) initAudioContext();
      updateUI();
    }).catch(() => {});
  }
  updateUI();
}

function prevTrack() {
  let idx = currentSong - 1;
  if (idx < 0) idx = songs.length - 1;
  playSong(idx);
}

function nextTrack() {
  let idx = currentSong + 1;
  if (idx >= songs.length) idx = 0;
  playSong(idx);
}

function updateUI() {
  if (!playBtn) return;
  playBtn.textContent = isPlaying ? '❚❚' : '▶';
  vinylDisc?.classList.toggle('playing', isPlaying);
  strobe?.classList.toggle('active', isPlaying);

  // Start/stop circular visualizer with play state
  if (isPlaying && audioCtx) {
    drawCircularViz();
  }

  if (songNameDisplay && currentSong >= 0) {
    songNameDisplay.textContent = songs[currentSong].name;
  }

  document.querySelectorAll('.song-item').forEach((el, i) => {
    el.classList.toggle('active', i === currentSong);
  });
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  if (progressFill) progressFill.style.width = pct + '%';
  if (currentTimeEl) currentTimeEl.textContent = fmt(audio.currentTime);
  if (totalTimeEl) totalTimeEl.textContent = fmt(audio.duration);
});

audio.addEventListener('ended', () => { nextTrack(); });
audio.addEventListener('loadedmetadata', () => {
  if (totalTimeEl) totalTimeEl.textContent = fmt(audio.duration);
});

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

volumeSlider?.addEventListener('input', () => { audio.volume = volumeSlider.value; });
playBtn?.addEventListener('click', togglePlay);
prevBtn?.addEventListener('click', prevTrack);
nextBtn?.addEventListener('click', nextTrack);

document.querySelector('.progress-bar')?.addEventListener('click', (e) => {
  if (!audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

function renderSongs() {
  if (!songListEl) return;
  songListEl.innerHTML = songs.map((s, i) => `
    <div class="song-item${i === currentSong ? ' active' : ''}" data-index="${i}">
      <div class="song-icon">♪</div>
      <div class="song-info">
        <div class="song-name">${s.name}</div>
        <div class="song-artist">${s.artist}</div>
      </div>
      <a class="song-dl" href="${demoUrls[i]}" download target="_blank">↓</a>
    </div>
  `).join('');

  songListEl.querySelectorAll('.song-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.index);
      if (idx === currentSong) { togglePlay(); return; }
      playSong(idx);
    });
  });
}

renderSongs();
