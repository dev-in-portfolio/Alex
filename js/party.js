const PARTY_CONFIG = {
  mediaBaseUrl: 'https://happy-alex-2.netlify.app/',
  manifestUrl: 'https://happy-alex-2.netlify.app/data/manifest.json',
  historyErasUrl: 'https://happy-alex-2.netlify.app/data/history-eras.json',
  fallbackManifestUrl: 'data/manifest.snapshot.json',
};

const partyEls = {
  source: document.getElementById('partySource'),
  status: document.getElementById('partyStatus'),
  counter: document.getElementById('partyCounter'),
  viewer: document.getElementById('partyViewer'),
  slideA: document.getElementById('partySlideA'),
  slideB: document.getElementById('partySlideB'),
  next: document.getElementById('partyNext'),
  pause: document.getElementById('partyPause'),
  back: document.getElementById('partyBack'),
  fx: document.getElementById('partyFx'),
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
  sourceLabel: 'Loading…',
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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

function updateCounter() {
  if (!partyEls.counter) return;
  const total = partyState.photos.length;
  const current = partyState.index >= 0 ? partyState.index + 1 : 0;
  partyEls.counter.textContent = `${current.toString().padStart(3, '0')} / ${total.toString().padStart(3, '0')}`;
}

function setActiveButtonState() {
  if (partyEls.pause) {
    partyEls.pause.textContent = partyState.paused ? 'Play' : 'Pause';
  }
}

function buildDeck(startIndex = -1) {
  const shuffled = shuffle(partyState.photos);
  if (startIndex >= 0 && shuffled.length > 1 && shuffled[0]?.src === partyState.currentPhoto?.src) {
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
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function renderSparkles() {
  if (!partyEls.fx) return;
  const count = prefersReducedMotion ? 10 : 24;
  partyEls.fx.innerHTML = Array.from({ length: count }, (_, index) => {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const size = 6 + Math.random() * 12;
    const delay = Math.random() * 8;
    const duration = 8 + Math.random() * 7;
    return `<span style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s"></span>`;
  }).join('');
}

function renderSlide(photo, incomingLayer) {
  const img = incomingLayer === 'a' ? partyEls.slideA : partyEls.slideB;

  img.src = photo.src || '';
  img.alt = photo.title || 'Party photo';
  img.style.objectPosition = photo.objectPosition || 'center center';
  img.classList.add('is-active');

  if (incomingLayer === 'a') {
    partyEls.slideB.classList.remove('is-active');
  } else {
    partyEls.slideA.classList.remove('is-active');
  }

  updateCounter();
}

async function showNextPhoto() {
  const photo = nextFromDeck();
  if (!photo) return;
  partyState.currentPhoto = photo;
  partyState.index = (partyState.index + 1) % Math.max(partyState.photos.length, 1);

  try {
    await preloadImage(photo.src);
  } catch (error) {
    console.warn(error);
  }

  const layer = partyState.activeLayer === 'a' ? 'b' : 'a';
  renderSlide(photo, layer);
  partyState.activeLayer = layer;
  updateStatus(`${partyState.sourceLabel} · ${partyState.paused ? 'paused' : 'playing'} · ${partyState.deck.length} queued`);
}

function restartDeck() {
  buildDeck();
  partyState.index = -1;
  partyState.currentPhoto = null;
  partyState.activeLayer = 'a';
  if (partyEls.slideA) partyEls.slideA.classList.remove('is-active');
  if (partyEls.slideB) partyEls.slideB.classList.remove('is-active');
  showNextPhoto();
}

function startAutoAdvance() {
  stopAutoAdvance();
  const interval = prefersReducedMotion ? 10000 : 6200;
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
  updateStatus(`${partyState.sourceLabel} · ${partyState.paused ? 'paused' : 'playing'} · ${partyState.deck.length} queued`);
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
  updateSource(`${source.label} · ${partyState.albums.length} albums · ${totalPhotos} photos`);
  updateStatus(`Ready to party with ${totalPhotos} photos.`);

  buildDeck();
  renderSparkles();
  updateCounter();
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
  });
}

bindControls();
loadPartyData().catch((error) => {
  console.error(error);
  updateSource('Party Mode offline');
  updateStatus('The Party page could not load the A2 manifest.');
});
