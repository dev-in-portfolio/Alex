const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxCaption = document.getElementById('lightboxCaption');
let currentIdx = 0;
let items = [];

function openLightbox(index) {
  items = document.querySelectorAll('.gallery-item');
  if (!items.length) return;
  currentIdx = index;
  showItem();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function showItem() {
  const item = items[currentIdx];
  if (!item) return;
  const colors = [
    '#0a0a1a,#1a1a3a', '#1a0a1a,#3a1a2a', '#0a1a1a,#1a3a3a',
    '#1a1a0a,#3a3a1a', '#1a0a0a,#3a1a1a', '#0a1a0a,#1a3a1a',
    '#0a0a1a,#2a1a3a', '#1a0a1a,#3a2a1a'
  ];
  const c = colors[currentIdx % colors.length].split(',');
  lightboxContent.innerHTML = `
    <div class="lightbox-placeholder" style="background:linear-gradient(135deg,${c[0]},${c[1]})">
      ${currentIdx + 1}
    </div>
  `;
  lightboxCaption.textContent = item.dataset.label + (item.dataset.desc ? ' — ' + item.dataset.desc : '');
}

lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

function prevImage() {
  currentIdx = (currentIdx - 1 + items.length) % items.length;
  showItem();
}

function nextImage() {
  currentIdx = (currentIdx + 1) % items.length;
  showItem();
}

document.addEventListener('keydown', (e) => {
  if (!lightbox?.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevImage();
  if (e.key === 'ArrowRight') nextImage();
});
