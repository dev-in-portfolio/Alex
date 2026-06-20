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

const visualizer = document.getElementById('visualizer');
const vCtx = visualizer?.getContext('2d');
if (vCtx) {
  visualizer.width = visualizer.clientWidth || 600;
  visualizer.height = visualizer.clientHeight || 80;
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

function drawVisualizer() {
  if (!vCtx || !analyser) return;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  vCtx.clearRect(0, 0, visualizer.width, visualizer.height);

  const barCount = 48;
  const step = Math.floor(bufferLength / barCount);
  const barW = visualizer.width / barCount - 2;

  for (let i = 0; i < barCount; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += dataArray[i * step + j];
    const avg = sum / step;
    const h = (avg / 255) * visualizer.height * 0.9;

    const t = i / barCount;
    const r = Math.round(212 - t * 40);
    const g = Math.round(175 - t * 30);
    const b = Math.round(55 + t * 20);

    vCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.5 + h / visualizer.height * 0.5})`;
    vCtx.fillRect(i * (barW + 2), visualizer.height - h, barW, h);

    // glow
    vCtx.shadowBlur = 6;
    vCtx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
    vCtx.fillRect(i * (barW + 2), visualizer.height - h, barW, h);
    vCtx.shadowBlur = 0;
  }

  animFrame = requestAnimationFrame(drawVisualizer);
}

function stopVisualizer() {
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
  if (vCtx) {
    vCtx.clearRect(0, 0, visualizer.width, visualizer.height);
  }
}

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

function renderSongs() {
  if (!songListEl) return;
  songListEl.innerHTML = songs.map((s, i) => `
    <div class="song-item${i === currentSong ? ' active' : ''}" data-index="${i}">
      <div class="song-icon">♪</div>
      <div class="song-info">
        <div class="song-name">${s.name}</div>
        <div class="song-artist">${s.artist}</div>
      </div>
      <a class="song-dl" href="${demoUrls[i]}" download target="_blank" title="Download">↓</a>
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

function playSong(index) {
  if (index < 0 || index >= songs.length) return;
  currentSong = index;
  audio.src = demoUrls[index];
  audio.load();
  audio.play().then(() => {
    isPlaying = true;
    initAudioContext();
    drawVisualizer();
    updateUI();
  }).catch(() => {
    isPlaying = false;
    updateUI();
  });
  updateUI();
}

function togglePlay() {
  if (currentSong < 0) { playSong(0); return; }
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    stopVisualizer();
  } else {
    audio.play().then(() => {
      isPlaying = true;
      initAudioContext();
      drawVisualizer();
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

// Resize visualizer
window.addEventListener('resize', () => {
  if (visualizer) {
    visualizer.width = visualizer.clientWidth;
    visualizer.height = visualizer.clientHeight;
  }
});

renderSongs();
