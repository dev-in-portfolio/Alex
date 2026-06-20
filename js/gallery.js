const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxCaption = document.getElementById('lightboxCaption');
let currentIndex = 0;
let items = [];

function openLightbox(index) {
  items = document.querySelectorAll('.gallery-item');
  if (!items.length) return;
  currentIndex = index;
  showLightboxItem();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showLightboxItem() {
  const item = items[currentIndex];
  if (!item) return;
  const label = item.dataset.label || 'Photo';
  const desc = item.dataset.desc || '';
  const colors = [
    '#1a1a2e,#16213e', '#2d1b3d,#1a1a2e', '#16213e,#0f3460',
    '#3d1b1b,#1a1a2e', '#1b3d2d,#16213e', '#3d2d1b,#2d1b3d',
    '#1b1b3d,#0f3460', '#3d1b2d,#1a1a2e'
  ];
  const c = colors[currentIndex % colors.length].split(',');
  lightboxContent.innerHTML = `
    <div class="lightbox-placeholder" style="background:linear-gradient(135deg,${c[0]},${c[1]})">
      ${currentIndex + 1}
    </div>
  `;
  lightboxCaption.textContent = `${label}${desc ? ' — ' + desc : ''}`;
}

lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
});

function prevImage() {
  currentIndex = (currentIndex - 1 + items.length) % items.length;
  showLightboxItem();
}

function nextImage() {
  currentIndex = (currentIndex + 1) % items.length;
  showLightboxItem();
}

document.addEventListener('keydown', (e) => {
  if (!lightbox?.classList.contains('active')) return;
  if (e.key === 'Escape') { lightbox.classList.remove('active'); document.body.style.overflow = ''; }
  if (e.key === 'ArrowLeft') prevImage();
  if (e.key === 'ArrowRight') nextImage();
});
