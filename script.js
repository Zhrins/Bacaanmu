/* ============================================================
   DUA CERITA — Main Script
   ============================================================ */

const NOVELS = {
  '177-hari': window.NOVEL_177_HARI,
  '365-hari': window.NOVEL_365_HARI
};

let currentNovelKey = null;
let currentNovel = null;

// ============ INIT ============
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSettings();
  buildLibrary();
  initProgressBar();
  initTopBar();
  initToc();
  initRatingSystem();
  initMusic();
});

// ============ THEME ============
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  setTheme(saved);
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.addEventListener('click', () => setTheme(b.dataset.theme));
  });
  document.getElementById('btn-theme-quick').addEventListener('click', () => {
    const themes = ['dark', 'sepia', 'light'];
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(themes[(themes.indexOf(cur) + 1) % themes.length]);
  });
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
  localStorage.setItem('theme', t);
}

// ============ SETTINGS ============
function initSettings() {
  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('settings').classList.toggle('open');
  });
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const map = { small: ['0.95rem','1.85'], medium: ['1.05rem','1.95'], large: ['1.2rem','2.05'] };
      document.documentElement.style.setProperty('--reader-font-size', map[btn.dataset.size][0]);
      document.documentElement.style.setProperty('--reader-line-height', map[btn.dataset.size][1]);
      localStorage.setItem('fontSize', btn.dataset.size);
    });
  });
  const savedSize = localStorage.getItem('fontSize') || 'medium';
  const sizeBtn = document.querySelector(`.size-btn[data-size="${savedSize}"]`);
  if (sizeBtn) sizeBtn.click();
}

// ============ LIBRARY ============
function buildLibrary() {
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '';
  Object.entries(NOVELS).forEach(([key, novel]) => {
    if (!novel) return;
    const card = document.createElement('div');
    card.className = 'novel-card';
    card.innerHTML = `
      <div class="novel-card-cover" style="--card-color-1:${novel.coverColor1};--card-color-2:${novel.coverColor2};">
        <span class="novel-card-badge">${novel.badge || 'NOVEL'}</span>
        <span class="novel-card-num">${novel.coverNumber}</span>
        <span class="novel-card-unit">${novel.coverUnit}</span>
      </div>
      <div class="novel-card-body">
        <h3 class="novel-card-title">${novel.title}</h3>
        <div class="novel-card-meta">
          <span>📖 ${novel.chapters.length} Bab</span>
          <span>📍 ${novel.location}</span>
        </div>
        <p class="novel-card-desc">${novel.description}</p>
        <div class="novel-card-rating">
          <span class="num">${novel.baseRating.toFixed(1).replace('.', ',')}</span>
          <span>${renderStars(novel.baseRating)}</span>
          <span class="count">${novel.baseCount.toLocaleString('id-ID')} rating</span>
        </div>
        <span class="novel-card-btn">Baca Sekarang →</span>
      </div>
    `;
    card.addEventListener('click', () => openNovel(key));
    grid.appendChild(card);
  });
}

function renderStars(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// ============ OPEN NOVEL ============
function openNovel(key) {
  currentNovelKey = key;
  currentNovel = NOVELS[key];
  if (!currentNovel) return;

  // Hide library, show cover + novel
  document.getElementById('library').style.display = 'none';
  document.getElementById('cover').style.display = 'grid';
  document.getElementById('novel').style.display = 'block';

  // Cover
  document.getElementById('cover-eyebrow').textContent = currentNovel.eyebrow || 'NOVEL INTERAKTIF · 2026';
  document.getElementById('cover-big').textContent = currentNovel.coverNumber;
  document.getElementById('cover-small').textContent = currentNovel.coverUnit;
  document.getElementById('cover-sub').innerHTML = currentNovel.subtitle;
  document.getElementById('topbar-title').innerHTML = currentNovel.topbarTitle;
  document.title = currentNovel.title + ' — Web Novel';

  // Route
  if (currentNovel.route) {
    document.getElementById('route-city-1').textContent = currentNovel.route.from;
    document.getElementById('route-km').textContent = currentNovel.route.distance;
    document.getElementById('route-city-2').textContent = currentNovel.route.to;
    document.getElementById('cover-route').style.display = 'flex';
  } else {
    document.getElementById('cover-route').style.display = 'none';
  }

  // Build chapters
  buildChapters();
  buildToc();

  // Reset scroll
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Restore rating widget
  restoreGlobalRating();
  restoreUserRating();
  restoreChapterRatings();
}

// ============ BACK TO LIBRARY ============
document.getElementById('btn-back').addEventListener('click', () => {
  if (!currentNovelKey) return;
  if (!confirm('Kembali ke perpustakaan? Progres baca akan tetap tersimpan.')) return;
  goToLibrary();
});

function goToLibrary() {
  currentNovelKey = null;
  currentNovel = null;
  document.getElementById('library').style.display = 'grid';
  document.getElementById('cover').style.display = 'none';
  document.getElementById('novel').style.display = 'none';
  document.getElementById('novel').innerHTML = '';
  document.getElementById('topbar-title').innerHTML = 'DUA <span>Cerita</span>';
  document.title = 'DUA CERITA — Web Novel Interaktif';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ BUILD CHAPTERS ============
function buildChapters() {
  const container = document.getElementById('novel');
  container.innerHTML = '';

  currentNovel.chapters.forEach((ch, idx) => {
    const article = document.createElement('article');
    article.className = 'chapter';
    article.id = 'chapter-' + (idx + 1);
    article.dataset.chapter = idx + 1;

    let html = '';
    if (ch.part) html += `<p class="chapter-part-label">${ch.part}</p>`;
    if (ch.numLabel) html += `<p class="chapter-num-label">${ch.numLabel}</p>`;
    html += `<h2>${ch.title}</h2>`;

    ch.content.forEach(block => {
      html += renderBlock(block);
    });

    html += `<p class="chapter-end">${ch.endLabel || 'Bersambung'}</p>`;

    // Chapter rating
    html += `
      <div class="chapter-rate">
        <p class="rate-label">Beri rating bab ini</p>
        <div class="rate-stars" data-rate-for="${currentNovelKey}-ch${idx + 1}">
          <span class="rate-star" data-value="1">★</span>
          <span class="rate-star" data-value="2">★</span>
          <span class="rate-star" data-value="3">★</span>
          <span class="rate-star" data-value="4">★</span>
          <span class="rate-star" data-value="5">★</span>
        </div>
        <p class="rate-feedback"></p>
      </div>
    `;

    // Next chapter button
    if (idx < currentNovel.chapters.length - 1) {
      html += `<button class="next-chapter" onclick="document.getElementById('chapter-${idx + 2}').scrollIntoView({behavior:'smooth'})">
        Lanjut ke Bab ${idx + 2} <span>→</span>
      </button>`;
    }

    article.innerHTML = html;
    container.appendChild(article);
  });

  // Footer
  const footer = document.createElement('footer');
  footer.className = 'end-footer';
  footer.innerHTML = `
    <p class="the-end">— ${currentNovel.endLabel || 'Tamat'} —</p>
    <p class="quote-final">${currentNovel.closingQuote}</p>
    <p class="credits">${currentNovel.title} · WEB NOVEL INTERAKTIF · 2026</p>
  `;
  container.appendChild(footer);
}

function renderBlock(block) {
  if (typeof block === 'string') return `<p>${block}</p>`;
  switch (block.type) {
    case 'p': return `<p>${block.text}</p>`;
    case 'scene': return `<div class="scene-break">${block.text || '· · ·'}</div>`;
    case 'pov': return `<p class="pov">${block.text}</p>`;
    case 'dialog': return `<p class="dialog">${block.text}</p>`;
    case 'chat':
      return `<div class="chat-mock">${block.lines.map(l =>
        `<p class="chat-line"><b>${l.from}</b> · ${l.text}</p>`).join('')}</div>`;
    case 'quote': return `<blockquote>${block.text}</blockquote>`;
    case 'moment':
      return `<div class="moment">
        <p class="moment-label">${block.label}</p>
        <p class="moment-title">${block.title}</p>
      </div>`;
    case 'code':
      return `<div class="code-mock">${block.lines.join('<br>')}</div>`;
    case 'music-btn':
      return `<button class="story-btn" id="btn-${block.id}" data-music="${block.musicId}">♪ ${block.label}</button>`;
    case 'audio-btn':
      return `<button class="story-btn" id="btn-${block.id}" data-audio="${block.audioId}">▶ ${block.label}</button>`;
    default: return '';
  }
}

// ============ TOC ============
function buildToc() {
  const body = document.getElementById('toc-body');
  body.innerHTML = '';
  document.getElementById('toc-title').textContent = currentNovel.title;
  document.getElementById('toc-subtitle').textContent =
    `${currentNovel.chapters.length} BAB · ${currentNovel.parts || 1} BAGIAN`;

  currentNovel.chapters.forEach((ch, idx) => {
    if (ch.part) {
      const p = document.createElement('div');
      p.className = 'toc-part';
      p.textContent = ch.part.replace(/Bagian [IVX]+ · /i, '').toUpperCase();
      body.appendChild(p);
    }
    const a = document.createElement('a');
    a.className = 'toc-item';
    a.href = '#chapter-' + (idx + 1);
    const num = String(idx + 1).padStart(2, '0');
    a.innerHTML = `<span class="num">${num}</span><span>${ch.tocTitle || ch.title}</span>`;
    a.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('chapter-' + (idx + 1)).scrollIntoView({ behavior: 'smooth' });
      closeToc();
    });
    body.appendChild(a);
  });
}

function initToc() {
  const toc = document.getElementById('toc');
  const overlay = document.getElementById('toc-overlay');
  document.getElementById('btn-toc').addEventListener('click', () => {
    if (!currentNovelKey) return;
    toc.classList.add('open'); overlay.classList.add('open');
  });
  document.getElementById('toc-close').addEventListener('click', closeToc);
  overlay.addEventListener('click', closeToc);
  function closeToc() { toc.classList.remove('open'); overlay.classList.remove('open'); }
  window.closeToc = closeToc;
}

// ============ PROGRESS BAR + TOPBAR ============
function initProgressBar() {
  window.addEventListener('scroll', () => {
    const st = window.scrollY;
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    document.getElementById('progress-bar').style.width = (st / dh) * 100 + '%';
    document.getElementById('to-top').classList.toggle('show', st > 600);
  });
  document.getElementById('to-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initTopBar() {
  // Hide back btn when in library
  const updateBackBtn = () => {
    document.getElementById('btn-back').style.visibility = currentNovelKey ? 'visible' : 'hidden';
  };
  const observer = new MutationObserver(updateBackBtn);
  observer.observe(document.body, { attributes: true });
  updateBackBtn();
}

// ============ RATING SYSTEM ============
const ratingKey = 'duaCerita_ratings';
let allRatings = JSON.parse(localStorage.getItem(ratingKey) || '{}');

function initRatingSystem() {
  // User rating on cover
  const starsEl = document.getElementById('user-rate-stars');
  const feedback = document.getElementById('user-rate-feedback');
  starsEl.querySelectorAll('.rate-star').forEach(star => {
    star.addEventListener('mouseenter', () => {
      const v = parseInt(star.dataset.value);
      starsEl.querySelectorAll('.rate-star').forEach(s =>
        s.classList.toggle('hover', parseInt(s.dataset.value) <= v));
    });
    star.addEventListener('mouseleave', () => {
      starsEl.querySelectorAll('.rate-star').forEach(s => s.classList.remove('hover'));
    });
    star.addEventListener('click', () => {
      if (!currentNovelKey) return;
      const v = parseInt(star.dataset.value);
      if (!allRatings[currentNovelKey]) allRatings[currentNovelKey] = {};
      allRatings[currentNovelKey].global = v;
      localStorage.setItem(ratingKey, JSON.stringify(allRatings));
      updateStars(starsEl, v);
      feedback.textContent = getFeedback(v);
      updateGlobalScore();
    });
  });
}

function updateStars(container, value) {
  container.querySelectorAll('.rate-star').forEach((s, i) =>
    s.classList.toggle('active', i < value));
}

function getFeedback(v) {
  const t = { 1:'😢 Kurang suka ya?', 2:'😕 Hmm, bisa lebih baik.', 3:'🙂 Lumayan.', 4:'😊 Bagus!', 5:'🤩 Luar biasa!' };
  return t[v] || '';
}

function updateGlobalScore() {
  if (!currentNovel) return;
  const novelRatings = allRatings[currentNovelKey] || {};
  const userVals = Object.entries(novelRatings)
    .filter(([k]) => k !== 'global')
    .map(([, v]) => v);
  const globalVal = novelRatings.global || 0;

  const baseScore = currentNovel.baseRating;
  const baseCount = currentNovel.baseCount;

  const allVals = userVals.concat(globalVal ? [globalVal] : []);
  if (!allVals.length) {
    document.getElementById('global-score').textContent = baseScore.toFixed(1).replace('.', ',');
    document.getElementById('global-count').textContent = baseCount.toLocaleString('id-ID');
    document.getElementById('global-stars').textContent = renderStars(baseScore);
    return;
  }
  const userSum = allVals.reduce((a, b) => a + b, 0);
  const userAvg = userSum / allVals.length;
  const totalScore = ((baseScore * baseCount) + (userAvg * allVals.length)) / (baseCount + allVals.length);
  const totalCount = baseCount + allVals.length;
  document.getElementById('global-score').textContent = totalScore.toFixed(1).replace('.', ',');
  document.getElementById('global-count').textContent = totalCount.toLocaleString('id-ID');
  document.getElementById('global-stars').textContent = renderStars(totalScore);
}

function restoreGlobalRating() { updateGlobalScore(); }

function restoreUserRating() {
  const starsEl = document.getElementById('user-rate-stars');
  const feedback = document.getElementById('user-rate-feedback');
  const novelRatings = allRatings[currentNovelKey] || {};
  if (novelRatings.global) {
    updateStars(starsEl, novelRatings.global);
    feedback.textContent = getFeedback(novelRatings.global);
  } else {
    updateStars(starsEl, 0);
    feedback.textContent = '';
  }
}

function restoreChapterRatings() {
  document.querySelectorAll('.chapter-rate .rate-stars').forEach(container => {
    const cid = container.dataset.rateFor;
    const stars = container.querySelectorAll('.rate-star');
    const feedback = container.parentElement.querySelector('.rate-feedback');
    const saved = (allRatings[currentNovelKey] || {})[cid];
    if (saved) { updateStars(container, saved); feedback.textContent = getFeedback(saved); }

    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const v = parseInt(star.dataset.value);
        stars.forEach(s => s.classList.toggle('hover', parseInt(s.dataset.value) <= v));
      });
      star.addEventListener('mouseleave', () => stars.forEach(s => s.classList.remove('hover')));
      star.addEventListener('click', () => {
        const v = parseInt(star.dataset.value);
        if (!allRatings[currentNovelKey]) allRatings[currentNovelKey] = {};
        allRatings[currentNovelKey][cid] = v;
        localStorage.setItem(ratingKey, JSON.stringify(allRatings));
        updateStars(container, v);
        feedback.textContent = getFeedback(v);
        updateGlobalScore();
      });
    });
  });
}

// ============ MUSIC ============
let musicOn = false;
function initMusic() {
  const bg = document.getElementById('audio-warmness');
  document.getElementById('btn-music').addEventListener('click', function () {
    if (!musicOn) {
      bg.volume = 0.25;
      bg.play().catch(() => {});
      this.classList.add('active');
      musicOn = true;
    } else {
      bg.pause();
      this.classList.remove('active');
      musicOn = false;
    }
  });

  // Delegated event untuk story-btn
  document.addEventListener('click', e => {
    const btn = e.target.closest('.story-btn');
    if (!btn) return;
    if (btn.dataset.audio === 'tawa') {
      const a = document.getElementById('audio-tawa');
      if (a.paused) {
        a.play().catch(() => {});
        btn.textContent = '⏸ Suara Sedang Diputar';
        btn.classList.add('playing');
      } else {
        a.pause(); a.currentTime = 0;
        btn.textContent = '▶ ' + (btn.dataset.origLabel || 'Putar Suara');
        btn.classList.remove('playing');
      }
    } else if (btn.dataset.music) {
      const playing = btn.classList.toggle('playing');
      if (playing) {
        btn.textContent = '⏸ Sedang Diputar';
        bg.volume = 0.3;
        bg.play().catch(() => {});
        document.getElementById('btn-music').classList.add('active');
        musicOn = true;
      } else {
        btn.textContent = '♪ ' + (btn.dataset.origLabel || 'Putar Lagu');
      }
    }
  });
}

// Save original labels
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.story-btn').forEach(btn => {
    btn.dataset.origLabel = btn.textContent.replace(/^[♪▶]\s*/, '');
  });
});

// ============ ACTIVE TOC OBSERVER ============
window.addEventListener('scroll', () => {
  if (!currentNovelKey) return;
  const chapters = document.querySelectorAll('.chapter');
  const tocItems = document.querySelectorAll('.toc-item');
  let activeId = null;
  chapters.forEach(ch => {
    const rect = ch.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.4) activeId = ch.id;
  });
  if (activeId) {
    tocItems.forEach(i => i.classList.toggle('active', i.getAttribute('href') === '#' + activeId));
  }
});
