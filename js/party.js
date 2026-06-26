const PARTY_CONFIG = {
  mediaBaseUrl: 'https://happy-alex-2.netlify.app/',
  manifestUrl: 'https://happy-alex-2.netlify.app/data/manifest.json',
  historyErasUrl: 'https://happy-alex-2.netlify.app/data/history-eras.json',
  fallbackManifestUrl: 'data/manifest.snapshot.json',
  ambientPulseEnabled: true,
  ambientPulseKey: 'alex-party-ambient-pulse',
};

const partyEls = {
  source: document.getElementById('partySource'),
  status: document.getElementById('partyStatus'),
  caption: document.getElementById('partyCaption'),
  counter: document.getElementById('partyCounter'),
  progress: document.getElementById('partyProgress'),
  viewer: document.getElementById('partyViewer'),
  backdrop: document.getElementById('partyBackdrop'),
  slideA: document.getElementById('partySlideA'),
  slideB: document.getElementById('partySlideB'),
  next: document.getElementById('partyNext'),
  pause: document.getElementById('partyPause'),
  fullscreen: document.getElementById('partyFullscreen'),
  fullscreenExit: document.getElementById('partyFullscreenExit'),
  pulse: document.getElementById('partyPulse'),
  back: document.getElementById('partyBack'),
  fx: document.getElementById('partyFx'),
  cursorDot: document.getElementById('partyCursorDot'),
  cursorRing: document.getElementById('partyCursorRing'),
};

const partyState = {
  photos: [],
  albums: [],
  historyEras: [],
  deck: [],
  currentPhoto: null,
  activeLayer: 'a',
  index: -1,
  paused: false,
  timer: null,
  sourceLabel: 'Loading...',
  fullscreen: false,
  pulseEnabled: false,
  transitionTimer: null,
  cursorX: 0,
  cursorY: 0,
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isAbsoluteUrl(value = '') {
  return /^(https?:|data:|blob:)/i.test(value);
}

function mediaUrl(path) {
  if (!path) return '';
  if (isAbsoluteUrl(path)) return path;
  return new URL(path, PARTY_CONFIG.mediaBaseUrl).href;
}

function fetchJson(url) {
  return fetch(url, { cache: 'no-store' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.json();
  });
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function deriveFallbackEras(albums) {
  return albums.map((album, index) => ({
    number: index + 1,
    title: album.title || `Album ${index + 1}`,
    dateRange: album.year || 'unknown-year',
    description: 'Timeline framing unavailable in fallback mode.',
  }));
}

function buildAlbumEraLookup(historyEras) {
  const lookup = new Map();
  historyEras.forEach((era, index) => {
    lookup.set(index + 1, {
      number: Number(era?.number) || index + 1,
      title: era?.title || `Era ${index + 1}`,
      dateRange: era?.dateRange || 'unknown-year',
      description: era?.description || '',
    });
  });
  return lookup;
}

function updateStatus(message) {
  if (partyEls.status) partyEls.status.textContent = message;
}

function updateSource(message) {
  if (partyEls.source) partyEls.source.textContent = message;
}

function updateCaption(photo) {
  if (!partyEls.caption) return;
  if (!photo) {
    partyEls.caption.textContent = 'Waiting for the first frame.';
    return;
  }

  const albumPart = photo.albumTitle ? `${photo.albumTitle}` : 'Party photo';
  const yearPart = photo.year ? ` | ${photo.year}` : '';
  const indexPart = typeof photo.photoIndex === 'number' ? ` | Shot ${String(photo.photoIndex + 1).padStart(2, '0')}` : '';
  partyEls.caption.textContent = `${albumPart}${yearPart}${indexPart}`;
}

function updateCounter() {
  if (!partyEls.counter) return;
  const total = partyState.photos.length;
  const current = partyState.index >= 0 ? partyState.index + 1 : 0;
  partyEls.counter.textContent = `${current.toString().padStart(3, '0')} / ${total.toString().padStart(3, '0')}`;
}

function updateProgress() {
  if (!partyEls.progress) return;
  const total = Math.max(partyState.photos.length, 1);
  const current = partyState.index >= 0 ? partyState.index + 1 : 0;
  const percent = Math.max(0, Math.min(100, (current / total) * 100));
  partyEls.progress.style.width = `${percent}%`;
}

function setActiveButtonState() {
  if (partyEls.pause) {
    partyEls.pause.textContent = partyState.paused ? 'Play' : 'Pause';
  }
  if (partyEls.fullscreen) {
    partyEls.fullscreen.textContent = partyState.fullscreen ? 'Exit Fullscreen' : 'Fullscreen';
  }
  if (partyEls.fullscreenExit) {
    partyEls.fullscreenExit.hidden = !partyState.fullscreen;
  }
  if (partyEls.pulse) {
    partyEls.pulse.textContent = partyState.pulseEnabled ? 'Pulse Off' : 'Pulse On';
  }
}

function buildDeck() {
  const shuffled = shuffle(partyState.photos);
  if (shuffled.length > 1 && shuffled[0]?.src === partyState.currentPhoto?.src) {
    shuffled.push(shuffled.shift());
  }
  partyState.deck = shuffled;
}

function nextFromDeck() {
  if (!partyState.deck.length) {
    buildDeck();
  }

  const next = partyState.deck.shift();
  if (!next) return null;

  if (partyState.currentPhoto && next.src === partyState.currentPhoto.src && partyState.deck.length) {
    return nextFromDeck();
  }

  return next;
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitCurrentPhoto(photo) {
  if (!partyEls.viewer || !photo) return;

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1280;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
  const ratio = (photo?.width && photo?.height) ? photo.width / photo.height : 1;
  const horizontalReserve = viewportWidth < 768 ? 24 : 64;
  const verticalReserve = viewportWidth < 768 ? 132 : 176;
  const maxWidth = Math.max(280, viewportWidth - horizontalReserve);
  const maxHeight = Math.max(320, viewportHeight - verticalReserve);

  let fittedWidth = maxWidth;
  let fittedHeight = fittedWidth / ratio;

  if (fittedHeight > maxHeight) {
    fittedHeight = maxHeight;
    fittedWidth = fittedHeight * ratio;
  }

  const backdropScale = ratio >= 1.4 ? 1.12 : ratio <= 0.85 ? 1.08 : 1.1;
  const objectPosition = photo.objectPosition || 'center center';
  const tilt = ((photo.photoIndex || 0) % 5 - 2) * 0.7;

  if (partyEls.viewer) {
    partyEls.viewer.style.setProperty('--party-media-width', `${Math.round(fittedWidth)}px`);
    partyEls.viewer.style.setProperty('--party-media-height', `${Math.round(fittedHeight)}px`);
    partyEls.viewer.style.setProperty('--party-backdrop-scale', `${backdropScale}`);
    partyEls.viewer.style.setProperty('--party-object-position', objectPosition);
    partyEls.viewer.style.setProperty('--party-tilt', `${tilt}deg`);
  }

  [partyEls.slideA, partyEls.slideB].forEach((img) => {
    if (!img) return;
    img.style.width = `${Math.round(fittedWidth)}px`;
    img.style.height = `${Math.round(fittedHeight)}px`;
    img.style.maxWidth = `${Math.round(fittedWidth)}px`;
    img.style.maxHeight = `${Math.round(fittedHeight)}px`;
    img.style.objectPosition = objectPosition;
  });
}

function renderSparkles() {
  if (!partyEls.fx) return;
  const count = prefersReducedMotion ? 10 : 24;
  partyEls.fx.innerHTML = Array.from({ length: count }, () => {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const size = 6 + Math.random() * 12;
    const delay = Math.random() * 8;
    const duration = 8 + Math.random() * 7;
    return `<span style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s"></span>`;
  }).join('');
}

function updatePartyCursor(x, y) {
  if (!partyState.fullscreen) return;
  if (partyEls.cursorDot) {
    partyEls.cursorDot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }
  if (partyEls.cursorRing) {
    partyEls.cursorRing.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }
}

function syncFullscreenState() {
  partyState.fullscreen = Boolean(document.fullscreenElement);
  document.body.classList.toggle('party-fullscreen', partyState.fullscreen);
  document.body.classList.toggle('party-local-cursor', partyState.fullscreen);
  setActiveButtonState();
}

async function toggleFullscreen() {
  if (!partyEls.viewer) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await partyEls.viewer.requestFullscreen?.();
}

function syncPulseState(forceValue) {
  let stored = null;
  try {
    stored = window.localStorage.getItem(PARTY_CONFIG.ambientPulseKey);
  } catch (error) {
    console.warn(error);
  }
  const enabled = typeof forceValue === 'boolean'
    ? forceValue
    : stored === null
      ? PARTY_CONFIG.ambientPulseEnabled
      : stored === 'true';

  partyState.pulseEnabled = enabled;
  document.body.classList.toggle('party-pulse', enabled);
  try {
    window.localStorage.setItem(PARTY_CONFIG.ambientPulseKey, String(enabled));
  } catch (error) {
    console.warn(error);
  }
  setActiveButtonState();
}

function togglePulse() {
  syncPulseState(!partyState.pulseEnabled);
}

function renderSlide(photo, incomingLayer) {
  const img = incomingLayer === 'a' ? partyEls.slideA : partyEls.slideB;
  const active = partyState.currentPhoto || photo;
  const outgoing = incomingLayer === 'a' ? partyEls.slideB : partyEls.slideA;

  if (!img) return;

  if (partyState.transitionTimer) {
    clearTimeout(partyState.transitionTimer);
    partyState.transitionTimer = null;
  }

  outgoing?.classList.remove('is-entering');
  outgoing?.classList.add('is-leaving');

  img.src = photo.src || '';
  img.alt = photo.title || 'Party photo';
  img.style.objectPosition = photo.objectPosition || 'center center';
  img.classList.add('is-active', 'is-entering');

  if (partyEls.backdrop) {
    partyEls.backdrop.style.backgroundImage = `url("${active.src || photo.src || ''}")`;
    partyEls.backdrop.style.backgroundPosition = photo.objectPosition || 'center center';
  }

  if (incomingLayer === 'a') {
    partyEls.slideB?.classList.remove('is-active');
  } else {
    partyEls.slideA?.classList.remove('is-active');
  }

  partyEls.viewer?.classList.remove('is-transitioning');
  void partyEls.viewer?.offsetWidth;
  partyEls.viewer?.classList.add('is-transitioning');
  partyState.transitionTimer = window.setTimeout(() => {
    partyEls.viewer?.classList.remove('is-transitioning');
    img.classList.remove('is-entering');
    outgoing?.classList.remove('is-leaving');
    partyState.transitionTimer = null;
  }, prefersReducedMotion ? 220 : 700);

  updateCounter();
  updateProgress();
}

async function showNextPhoto() {
  const photo = nextFromDeck();
  if (!photo) return;

  partyState.currentPhoto = photo;
  partyState.index = (partyState.index + 1) % Math.max(partyState.photos.length, 1);
  fitCurrentPhoto(photo);

  try {
    await preloadImage(photo.src);
  } catch (error) {
    console.warn(error);
  }

  const layer = partyState.activeLayer === 'a' ? 'b' : 'a';
  renderSlide(photo, layer);
  partyState.activeLayer = layer;
  updateCaption(photo);
  updateStatus(`${partyState.sourceLabel} | ${partyState.paused ? 'paused' : 'playing'} | ${partyState.deck.length} queued`);
}

function restartDeck() {
  buildDeck();
  partyState.index = -1;
  partyState.currentPhoto = null;
  partyState.activeLayer = 'a';
  partyEls.slideA?.classList.remove('is-active');
  partyEls.slideB?.classList.remove('is-active');
  updateCaption(null);
  updateCounter();
  updateProgress();
  showNextPhoto();
}

function startAutoAdvance() {
  stopAutoAdvance();
  const interval = prefersReducedMotion ? 12000 : 6800;
  partyState.timer = window.setInterval(() => {
    if (!partyState.paused) {
      showNextPhoto();
    }
  }, interval);
}

function stopAutoAdvance() {
  if (partyState.timer) {
    clearInterval(partyState.timer);
    partyState.timer = null;
  }
}

function togglePause(forceState) {
  partyState.paused = typeof forceState === 'boolean' ? forceState : !partyState.paused;
  setActiveButtonState();
  updateStatus(`${partyState.sourceLabel} | ${partyState.paused ? 'paused' : 'playing'} | ${partyState.deck.length} queued`);
}

async function loadPartyData() {
  const manifestSources = [
    { url: PARTY_CONFIG.manifestUrl, useMediaBase: true, label: 'Live A2 manifest' },
    { url: PARTY_CONFIG.fallbackManifestUrl, useMediaBase: false, label: 'Local fallback snapshot' },
  ];

  let manifest = null;
  let source = manifestSources[0];

  for (const candidate of manifestSources) {
    try {
      manifest = await fetchJson(candidate.url);
      source = candidate;
      break;
    } catch (error) {
      console.warn(error);
    }
  }

  if (!manifest) {
    throw new Error('Party Mode could not load a manifest.');
  }

  let historyEras = [];
  try {
    const history = await fetchJson(PARTY_CONFIG.historyErasUrl);
    historyEras = Array.isArray(history?.eras) ? history.eras : history;
  } catch (error) {
    console.warn(error);
    historyEras = deriveFallbackEras(manifest.albums || []);
  }

  const eraLookup = buildAlbumEraLookup(historyEras);
  const albums = Array.isArray(manifest.albums) ? manifest.albums : [];
  partyState.albums = albums.map((album, albumIndex) => ({
    ...album,
    era: eraLookup.get(albumIndex + 1) || null,
    photos: Array.isArray(album.photos)
      ? album.photos.map((photo) => ({
          ...photo,
          src: source.useMediaBase ? mediaUrl(photo.src) : (photo.src || ''),
          thumb: source.useMediaBase ? mediaUrl(photo.thumb) : (photo.thumb || ''),
          albumId: album.id,
          albumTitle: album.title,
          albumIndex,
        }))
      : [],
  }));

  partyState.photos = partyState.albums.flatMap((album) => album.photos.map((photo, photoIndex) => ({
    ...photo,
    photoIndex,
    objectPosition: `${30 + ((photoIndex * 17) % 40)}% ${30 + ((photoIndex * 23) % 40)}%`,
  })));
  partyState.historyEras = historyEras;
  partyState.sourceLabel = source.label;

  const totalPhotos = partyState.photos.length;
  updateSource(`${source.label} | ${partyState.albums.length} albums | ${totalPhotos} photos`);
  updateStatus(`Ready to party with ${totalPhotos} photos.`);

  buildDeck();
  renderSparkles();
  updateCaption(null);
  updateCounter();
  updateProgress();
  syncPulseState();
  setActiveButtonState();
  showNextPhoto();
  startAutoAdvance();
}

function bindControls() {
  partyEls.next?.addEventListener('click', () => {
    partyState.paused = false;
    setActiveButtonState();
    showNextPhoto();
  });

  partyEls.pause?.addEventListener('click', () => {
    togglePause();
  });

  partyEls.fullscreen?.addEventListener('click', () => {
    toggleFullscreen().catch((error) => {
      console.warn(error);
    });
  });

  partyEls.fullscreenExit?.addEventListener('click', () => {
    if (!document.fullscreenElement) return;
    document.exitFullscreen().catch((error) => {
      console.warn(error);
    });
  });

  partyEls.pulse?.addEventListener('click', () => {
    togglePulse();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      togglePause(true);
    }
    if (event.key === 'ArrowRight' || event.key === ' ') {
      event.preventDefault();
      partyState.paused = false;
      setActiveButtonState();
      showNextPhoto();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      restartDeck();
    }
    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleFullscreen().catch((error) => {
        console.warn(error);
      });
    }
    if (event.key.toLowerCase() === 'p') {
      event.preventDefault();
      togglePulse();
    }
  });

  window.addEventListener('resize', () => {
    fitCurrentPhoto(partyState.currentPhoto);
  });

  document.addEventListener('mousemove', (event) => {
    partyState.cursorX = event.clientX;
    partyState.cursorY = event.clientY;
    updatePartyCursor(event.clientX, event.clientY);
  });

  document.addEventListener('pointermove', (event) => {
    partyState.cursorX = event.clientX;
    partyState.cursorY = event.clientY;
    updatePartyCursor(event.clientX, event.clientY);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      togglePause(true);
    }
  });

  document.addEventListener('fullscreenchange', syncFullscreenState);
  syncFullscreenState();
  updatePartyCursor(window.innerWidth * 0.5, window.innerHeight * 0.5);
}

bindControls();
loadPartyData().catch((error) => {
  console.error(error);
  updateSource('Party Mode offline');
  updateStatus('The Party page could not load the A2 manifest.');
});
