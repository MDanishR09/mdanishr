const STORAGE_KEY = 'cs_reading_done';

// ── Storage helpers ──────────────────────────────────────────
function getRead() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveRead(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ── Progress bar ─────────────────────────────────────────────
function updateProgress() {
  const total = document.querySelectorAll('.paper').length;
  const done  = document.querySelectorAll('.done-btn.checked').length;
  document.getElementById('read-count').textContent = done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
}

// ── Mark read toggle ─────────────────────────────────────────
function toggleDone(btn) {
  const paper     = btn.closest('.paper');
  const key       = paper.dataset.title;
  const read      = getRead();
  const isChecked = btn.classList.toggle('checked');
  btn.querySelector('span').textContent = isChecked ? 'Read ✓' : 'Mark read';
  if (isChecked) { read[key] = true; } else { delete read[key]; }
  saveRead(read);
  updateProgress();
}

// ── Section collapse/expand ───────────────────────────────────
function toggleSection(header) {
  header.closest('.section').classList.toggle('open');
}

// ── Render a single paper from template ──────────────────────
function renderPaper(paper) {
  const tpl  = document.getElementById('tpl-paper');
  const node = tpl.content.cloneNode(true);
  const el   = node.querySelector('.paper');

  el.dataset.title  = paper.title;
  el.dataset.author = paper.author;

  el.querySelector('.paper-year').textContent   = paper.year;
  el.querySelector('.paper-title').textContent  = paper.title;
  el.querySelector('.paper-author').textContent = paper.author;

  const link = el.querySelector('.read-link');
  link.href  = paper.link;
  el.querySelector('.link-label').textContent = paper.linkLabel;

  // Restore saved read state
  const read = getRead();
  if (read[paper.title]) {
    el.querySelector('.done-btn').classList.add('checked');
    el.querySelector('.done-btn span').textContent = 'Read ✓';
  }

  return node;
}

// ── Render a single section from template ────────────────────
function renderSection(section, isFirst) {
  const tpl  = document.getElementById('tpl-section');
  const node = tpl.content.cloneNode(true);
  const el   = node.querySelector('.section');

  if (isFirst) el.classList.add('open');

  el.dataset.sectionId = section.id;
  el.querySelector('.section-num').textContent   = section.num;
  el.querySelector('.section-title').textContent = section.title;
  el.querySelector('.section-count').textContent = `${section.papers.length} paper${section.papers.length !== 1 ? 's' : ''}`;

  const body = el.querySelector('.section-body');
  section.papers.forEach(paper => body.appendChild(renderPaper(paper)));

  return node;
}

// ── Render progress strategy ──────────────────────────────────
function renderStrategy(items) {
  const container = document.getElementById('strategy-container');

  const tplTitle = document.getElementById('tpl-strategy');
  container.appendChild(tplTitle.content.cloneNode(true));

  const tplItem = document.getElementById('tpl-strategy-item');
  items.forEach(text => {
    const node = tplItem.content.cloneNode(true);
    node.querySelector('.strategy-item').textContent = text;
    container.appendChild(node);
  });
}

// ── Search ────────────────────────────────────────────────────
function initSearch() {
  document.getElementById('search').addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    let anyVisible = false;

    document.querySelectorAll('.section').forEach(section => {
      let sectionHasMatch = false;

      section.querySelectorAll('.paper').forEach(paper => {
        const title  = (paper.dataset.title  || '').toLowerCase();
        const author = (paper.dataset.author || '').toLowerCase();
        const year   = paper.querySelector('.paper-year').textContent;
        const match  = !q || title.includes(q) || author.includes(q) || year.includes(q);
        paper.style.display = match ? '' : 'none';
        if (match) sectionHasMatch = true;
      });

      section.style.display = sectionHasMatch ? '' : 'none';
      if (sectionHasMatch) {
        anyVisible = true;
        if (q) section.classList.add('open');
      }
    });

    document.getElementById('no-results').style.display = anyVisible ? 'none' : 'block';
  });
}

// ── Bootstrap ─────────────────────────────────────────────────
async function init() {
  let data;
  try {
    const res = await fetch('assets/data/data.json');
    data = await res.json();
  } catch (err) {
    console.error('Failed to load data.json:', err);
    document.getElementById('sections-container').innerHTML =
      '<p style="color:#7A8BA0;padding:24px;font-family:monospace">Error: could not load data.json. Make sure all files are in the same folder.</p>';
    return;
  }

  const container = document.getElementById('sections-container');
  data.sections.forEach((section, i) => {
    container.appendChild(renderSection(section, i === 0));
  });

  // Update header stats
  const totalPapers = data.sections.reduce((sum, s) => sum + s.papers.length, 0);
  document.getElementById('total-papers').textContent  = totalPapers;
  document.getElementById('total-sections').textContent = data.sections.length;

  renderStrategy(data.strategy);
  updateProgress();
  initSearch();
}

init();
