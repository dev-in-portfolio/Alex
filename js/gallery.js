const GALLERY_CONFIG = {
  mediaBaseUrl: 'https://happy-alex-2.netlify.app/',
  manifestUrl: 'https://happy-alex-2.netlify.app/data/manifest.json',
  historyErasUrl: 'https://happy-alex-2.netlify.app/data/history-eras.json',
  fallbackManifestUrl: 'data/manifest.snapshot.json',
};

const galleryState = {
  manifest: null,
  historyEras: [],
  albums: [],
  selectedAlbumIndex: -1,
  currentPhotos: [],
  lightboxIndex: -1,
};

const galleryEls = {
  source: document.getElementById('gallerySource'),
  status: document.getElementById('galleryStatus'),
  albumList: document.getElementById('albumList'),
  activeAlbumTitle: document.getElementById('activeAlbumTitle'),
  activeAlbumMeta: document.getElementById('activeAlbumMeta'),
  activeAlbumEraDescription: document.getElementById('activeAlbumEraDescription'),
  photoGrid: document.getElementById('photoGrid'),
  lightbox: document.getElementById('galleryLightbox'),
  lightboxImage: document.getElementById('lightboxImage'),
  lightboxCaption: document.getElementById('lightboxCaption'),
  lightboxClose: document.getElementById('lightboxClose'),
  lightboxPrev: document.getElementById('lightboxPrev'),
  lightboxNext: document.getElementById('lightboxNext'),
};

const palette = [
  ['#0a0a1a', '#1a1a3a'],
  ['#1a0a1a', '#3a1a2a'],
  ['#0a1a1a', '#1a3a3a'],
  ['#1a1a0a', '#3a3a1a'],
  ['#1a0a0a', '#3a1a1a'],
  ['#0a1a0a', '#1a3a1a'],
  ['#0a0a1a', '#2a1a3a'],
  ['#1a0a1a', '#3a2a1a'],
];

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
  return new URL(path, GALLERY_CONFIG.mediaBaseUrl).href;
}

function placeholderDataUri(primary, secondary = '') {
  const [bgA, bgB] = palette[Math.abs(primary.length + secondary.length) % palette.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${escapeHtml(primary)}">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${bgA}"/>
          <stop offset="100%" stop-color="${bgB}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="48" fill="url(#g)"/>
      <circle cx="640" cy="130" r="90" fill="rgba(212,175,55,0.14)"/>
      <circle cx="150" cy="640" r="110" fill="rgba(212,175,55,0.08)"/>
      <text x="60" y="360" fill="#f5e6a3" font-family="Georgia, serif" font-size="42" font-weight="700">${escapeHtml(primary)}</text>
      <text x="60" y="430" fill="#f0ebe0" font-family="Inter, Arial, sans-serif" font-size="24">${escapeHtml(secondary)}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function updateStatus(message) {
  if (galleryEls.status) galleryEls.status.textContent = message;
}

function updateSourceLabel(message) {
  if (galleryEls.source) galleryEls.source.textContent = message;
}

function fetchJson(url) {
  return fetch(url, { cache: 'no-store' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.json();
  });
}

function deriveFallbackEras(manifest) {
  const albums = Array.isArray(manifest?.albums) ? manifest.albums : [];
  return albums.map((album, index) => ({
    number: index + 1,
    dateRange: album.year || 'unknown-year',
    title: album.title || `Album ${index + 1}`,
    description: 'History-era framing is unavailable in the local snapshot, so this album is shown as a birthday timeline chapter.',
  }));
}

function buildEraLookup(historyEras) {
  const lookup = new Map();
  historyEras.forEach((era, index) => {
    const key = Number(era?.number) || index + 1;
    lookup.set(key, {
      number: key,
      dateRange: era?.dateRange || era?.yearRange || 'unknown-year',
      title: era?.title || era?.name || `Era ${key}`,
      description: era?.description || '',
    });
  });
  return lookup;
}

function normalizePhoto(photo, albumTitle, useMediaBase) {
  const src = useMediaBase ? mediaUrl(photo.src) : (photo.src || '');
  const thumb = useMediaBase ? mediaUrl(photo.thumb) : (photo.thumb || '');
  return {
    ...photo,
    src,
    thumb,
    alt: photo.title || `${albumTitle} photo`,
  };
}

function normalizeAlbum(album, useMediaBase, era) {
  const photos = Array.isArray(album.photos)
    ? album.photos.map((photo) => normalizePhoto(photo, album.title, useMediaBase))
    : [];

  return {
    ...album,
    cover: useMediaBase ? mediaUrl(album.cover) : (album.cover || ''),
    photos,
    era: era || null,
    eraNumber: era?.number || null,
  };
}

async function loadManifestBundle() {
  const manifestSources = [
    { url: GALLERY_CONFIG.manifestUrl, label: 'A2 live media store', useMediaBase: true },
    { url: GALLERY_CONFIG.fallbackManifestUrl, label: 'local fallback snapshot', useMediaBase: false },
  ];

  let manifest = null;
  let sourceLabel = 'Gallery offline';
  let useMediaBase = false;

  for (const source of manifestSources) {
    try {
      manifest = await fetchJson(source.url);
      sourceLabel = source.label;
      useMediaBase = source.useMediaBase;
      break;
    } catch (error) {
      console.warn(error);
    }
  }

  if (!manifest) {
    throw new Error('Could not load either the live media manifest or the local snapshot.');
  }

  let historyEras = [];
  try {
    historyEras = await fetchJson(GALLERY_CONFIG.historyErasUrl);
    if (Array.isArray(historyEras?.eras)) {
      historyEras = historyEras.eras;
    }
  } catch (error) {
    console.warn(error);
    historyEras = deriveFallbackEras(manifest);
  }

  return { manifest, historyEras, sourceLabel, useMediaBase };
}

function renderAlbumCards() {
  if (!galleryEls.albumList) return;

  galleryEls.albumList.innerHTML = galleryState.albums.map((album, index) => {
    const isActive = index === galleryState.selectedAlbumIndex;
    const cover = album.cover || placeholderDataUri(album.title, album.year);
    const eraLine = album.era
      ? `<span class="album-era">${escapeHtml(album.era.number ? `Era ${album.era.number}` : 'Timeline chapter')} · ${escapeHtml(album.era.title)}</span>`
      : '';
    return `
      <button class="album-card${isActive ? ' is-active' : ''}" type="button" data-index="${index}">
        <span class="album-card-cover">
          <img src="${cover}" alt="${escapeHtml(album.title)} cover" loading="lazy" decoding="async">
        </span>
        <span class="album-card-copy">
          <span class="album-card-year">${escapeHtml(album.year || 'unknown-year')}</span>
          <strong>${escapeHtml(album.title)}</strong>
          ${eraLine}
          <span>${album.photoCount} photo${album.photoCount === 1 ? '' : 's'}</span>
        </span>
      </button>
    `;
  }).join('');

  galleryEls.albumList.querySelectorAll('.album-card').forEach((button) => {
    button.addEventListener('click', () => {
      selectAlbum(Number(button.dataset.index || 0));
    });
  });

  galleryEls.albumList.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      const title = img.alt || 'Album';
      img.src = placeholderDataUri(title, 'album cover');
    });
  });
}

function renderActiveAlbum() {
  const album = galleryState.albums[galleryState.selectedAlbumIndex];
  if (!album) {
    galleryEls.activeAlbumTitle.textContent = 'No album selected';
    galleryEls.activeAlbumMeta.textContent = 'The gallery did not receive any photos.';
    if (galleryEls.activeAlbumEraDescription) {
      galleryEls.activeAlbumEraDescription.textContent = '';
    }
    galleryEls.photoGrid.innerHTML = '';
    return;
  }

  const eraText = album.era
    ? ` · ${album.era.number ? `Era ${album.era.number}` : 'Timeline chapter'}: ${album.era.title}${album.era.dateRange ? ` (${album.era.dateRange})` : ''}`
    : '';

  galleryEls.activeAlbumTitle.textContent = album.title;
  galleryEls.activeAlbumMeta.textContent = `${album.year || 'unknown-year'} · ${album.photoCount} photo${album.photoCount === 1 ? '' : 's'}${eraText}`;
  if (galleryEls.activeAlbumEraDescription) {
    galleryEls.activeAlbumEraDescription.textContent = album.era?.description || '';
  }
  galleryEls.photoGrid.innerHTML = album.photos.map((photo, index) => {
    const thumb = photo.thumb || placeholderDataUri(photo.title, album.title);
    const label = photo.title || `Photo ${index + 1}`;
    const caption = `${label} · ${album.title}`;
    return `
      <button class="photo-card" type="button" data-index="${index}">
        <span class="photo-card-image">
          <img src="${thumb}" alt="${escapeHtml(caption)}" loading="lazy" decoding="async">
        </span>
        <span class="photo-card-copy">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(photo.originalName || '')}</span>
        </span>
      </button>
    `;
  }).join('');

  galleryEls.photoGrid.querySelectorAll('.photo-card').forEach((button) => {
    button.addEventListener('click', () => {
      openLightbox(Number(button.dataset.index || 0));
    });
  });

  galleryEls.photoGrid.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      const label = img.alt || 'Photo';
      img.src = placeholderDataUri(label, album.title);
    });
  });
}

function selectAlbum(index) {
  if (!galleryState.albums.length) return;
  const safeIndex = ((index % galleryState.albums.length) + galleryState.albums.length) % galleryState.albums.length;
  galleryState.selectedAlbumIndex = safeIndex;
  galleryState.currentPhotos = galleryState.albums[safeIndex].photos;
  galleryState.lightboxIndex = -1;
  renderAlbumCards();
  renderActiveAlbum();
}

function openLightbox(index) {
  if (!galleryState.currentPhotos.length) return;
  galleryState.lightboxIndex = ((index % galleryState.currentPhotos.length) + galleryState.currentPhotos.length) % galleryState.currentPhotos.length;
  const photo = galleryState.currentPhotos[galleryState.lightboxIndex];
  if (!photo) return;

  galleryEls.lightboxImage.src = photo.src || placeholderDataUri(photo.title, 'Alex gallery');
  galleryEls.lightboxImage.alt = photo.alt || photo.title || 'Gallery photo';

  const album = galleryState.albums[galleryState.selectedAlbumIndex];
  const era = album?.era
    ? ` · Era ${album.era.number}: ${album.era.title}`
    : '';
  galleryEls.lightboxCaption.textContent = `${photo.title || 'Photo'} · ${album?.title || ''}${era}`;
  galleryEls.lightbox.classList.add('is-open');
  galleryEls.lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  galleryEls.lightbox.classList.remove('is-open');
  galleryEls.lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function stepLightbox(direction) {
  if (!galleryState.currentPhotos.length || galleryState.lightboxIndex < 0) return;
  const nextIndex = ((galleryState.lightboxIndex + direction) % galleryState.currentPhotos.length + galleryState.currentPhotos.length) % galleryState.currentPhotos.length;
  openLightbox(nextIndex);
}

function bindLightboxControls() {
  galleryEls.lightboxClose?.addEventListener('click', closeLightbox);
  galleryEls.lightboxPrev?.addEventListener('click', () => stepLightbox(-1));
  galleryEls.lightboxNext?.addEventListener('click', () => stepLightbox(1));
  galleryEls.lightbox?.addEventListener('click', (event) => {
    if (event.target === galleryEls.lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!galleryEls.lightbox?.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') stepLightbox(-1);
    if (event.key === 'ArrowRight') stepLightbox(1);
  });
}

async function initGallery() {
  updateStatus('Loading gallery data…');
  try {
    const { manifest, historyEras, sourceLabel, useMediaBase } = await loadManifestBundle();
    const eraLookup = buildEraLookup(historyEras);

    galleryState.manifest = manifest;
    galleryState.historyEras = historyEras;
    galleryState.albums = Array.isArray(manifest.albums)
      ? manifest.albums.map((album, index) => normalizeAlbum(album, useMediaBase, eraLookup.get(index + 1)))
      : [];
    galleryState.selectedAlbumIndex = galleryState.albums.length ? 0 : -1;
    galleryState.currentPhotos = galleryState.selectedAlbumIndex >= 0 ? galleryState.albums[0].photos : [];
    galleryState.lightboxIndex = -1;

    const totalPhotos = manifest.photoCount || galleryState.albums.reduce((sum, album) => sum + album.photoCount, 0);
    updateSourceLabel(sourceLabel === 'A2 live media store'
      ? 'Live gallery connected to A2'
      : 'Using local fallback snapshot while A2 is unavailable');
    updateStatus(`Loaded ${galleryState.albums.length} album${galleryState.albums.length === 1 ? '' : 's'} and ${totalPhotos} photos.`);
    renderAlbumCards();
    renderActiveAlbum();
    bindLightboxControls();
  } catch (error) {
    console.error(error);
    updateSourceLabel('Gallery offline');
    updateStatus('The gallery could not load either the live manifest or the local fallback snapshot.');
    galleryEls.albumList.innerHTML = '';
    galleryEls.photoGrid.innerHTML = `
      <div class="gallery-empty">
        <h2>Gallery unavailable</h2>
        <p>Try again once A2 is published, or check the local snapshot file.</p>
      </div>
    `;
  }
}

initGallery();
