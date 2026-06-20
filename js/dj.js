const songs = [
  { name: 'Happy Birthday (Premium Mix)', artist: 'Celebration Orchestra', file: '' },
  { name: 'For Alex — 35 Vibes', artist: 'The Roast Masters', file: '' },
  { name: 'Birthday Dance Anthem', artist: 'Party Beats', file: '' },
  { name: '35 Candles', artist: 'Gold Symphony', file: '' },
  { name: 'Epic Birthday Rise', artist: 'Cinematic Dreams', file: '' },
  { name: 'Funky 35 Groove', artist: 'Soul Brass', file: '' },
];

const audio = new Audio();
let isPlaying = false;
let currentSong = -1;

// Free demo songs — replace with your own files in /songs/
const demoUrls = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
];

const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volumeSlider');
const nowPlayingName = document.getElementById('nowPlayingName');
const vinylDisc = document.querySelector('.vinyl-disc');
const songList = document.getElementById('songList');

function renderSongs() {
  if (!songList) return;
  songList.innerHTML = songs.map((s, i) => `
    <div class="song-item${i === currentSong ? ' active' : ''}" data-index="${i}">
      <div class="song-icon">♪</div>
      <div class="song-info">
        <div class="song-name">${s.name}</div>
        <div class="song-artist">${s.artist}</div>
      </div>
      <a class="download-btn" href="${demoUrls[i]}" download title="Download" target="_blank">↓</a>
    </div>
  `).join('');

  songList.querySelectorAll('.song-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.index);
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
  } else {
    audio.play().then(() => { isPlaying = true; updateUI(); }).catch(() => {});
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
  playBtn.innerHTML = isPlaying ? '❚❚' : '▶';
  vinylDisc?.classList.toggle('playing', isPlaying);

  if (nowPlayingName && currentSong >= 0) {
    nowPlayingName.textContent = songs[currentSong].name;
  }

  document.querySelectorAll('.song-item').forEach((el, i) => {
    el.classList.toggle('active', i === currentSong);
  });
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  if (progressFill) progressFill.style.width = pct + '%';
  if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
  if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  nextTrack();
});

audio.addEventListener('loadedmetadata', () => {
  if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
});

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

volumeSlider?.addEventListener('input', () => {
  audio.volume = volumeSlider.value;
});

playBtn?.addEventListener('click', togglePlay);
prevBtn?.addEventListener('click', prevTrack);
nextBtn?.addEventListener('click', nextTrack);

// Progress bar click
document.querySelector('.progress-bar')?.addEventListener('click', (e) => {
  if (!audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

renderSongs();
