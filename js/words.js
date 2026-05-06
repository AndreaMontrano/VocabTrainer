// ── Carica parole ─────────────────────────────────────────
async function loadWords() {
  const { data, error } = await db.from('words').select('*').order('id');
  if (error) console.error(error);
  else words = data;
  renderHome();
  renderDB();
}

// ── Aggiungi parola ───────────────────────────────────────
async function addWord() {
  const eng = document.getElementById('f-eng').value.trim();
  const ita = document.getElementById('f-ita').value.trim();
  const ctx = document.getElementById('f-ctx').value.trim();
  const cat = document.getElementById('f-cat').value;
  if (!eng || !ita) return;

  const { data, error } = await db.from('words').insert({ eng, ita, ctx, cat }).select();
  if (!error) words.push(data[0]);
  renderDB();
}

// ── Elimina parola ────────────────────────────────────────
async function deleteWord(id) {
  if (!confirm('Eliminare?')) return;
  await db.from('words').delete().eq('id', id);
  words = words.filter(w => w.id !== id);
  renderDB();
}

// ── Render database ───────────────────────────────────────
function renderDB() {
  const q = (document.getElementById('db-search')?.value || '').toLowerCase();
  let filtered = words.filter(w =>
    (selectedCat === 'all' || w.cat === selectedCat) &&
    (!q || w.eng.toLowerCase().includes(q) || w.ita.toLowerCase().includes(q))
  );
  const cats = ['all', ...new Set(words.map(w => w.cat))];
  document.getElementById('cat-filter').innerHTML = cats.map(c => `
    <button class="cat-pill ${selectedCat === c ? 'active' : ''}" onclick="filterCat('${c}')">${c === 'all' ? 'Tutte' : c}</button>
  `).join('');
  const list = document.getElementById('word-list');
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">Nessuna parola trovata.<br>Aggiungine una nuova!</div>`;
    return;
  }
  list.innerHTML = filtered.map(w => {
    const c = CAT_COLORS[w.cat] || CAT_COLORS.general;
    return `
    <div class="word-row">
      <span class="cat-badge" style="background:${c.bg};color:${c.text};border:1px solid ${c.border}">${w.cat}</span>
      <span class="eng-w">${w.eng}</span>
      <span class="ita-w">${w.ita}</span>
      ${w.ctx ? `<span class="ctx-w">"${w.ctx}"</span>` : '<span class="ctx-w"></span>'}
      <button class="btn-del" onclick="deleteWord(${w.id})">✕</button>
    </div>
  `}).join('');
}

// ── Filtro categorie ──────────────────────────────────────
function filterCat(c) { selectedCat = c; renderDB(); }

// ── Toggle form aggiunta ──────────────────────────────────
function toggleAddForm() {
  addFormOpen = !addFormOpen;
  document.getElementById('add-form').classList.toggle('open', addFormOpen);
  if (addFormOpen) document.getElementById('f-eng').focus();
}