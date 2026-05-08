// ── Carica liste ──────────────────────────────────────────
async function loadLists() {
  const { data, error } = await db.from('lists').select('*').order('name');
  if (error) { console.error(error); return; }
  renderLists(data);
}

// ── Render liste ──────────────────────────────────────────
function renderLists(lists) {
  const grid = document.getElementById('lists-grid');
  if (!lists?.length) {
    grid.innerHTML = `<div class="empty-state">Nessuna lista disponibile.</div>`;
    return;
  }
  grid.innerHTML = lists.map(l => `
    <div class="list-card" onclick="selectList(${l.id}, '${l.name}')">
      <div class="list-card-header">
        <span class="list-name">${l.name}</span>
        <span class="list-arrow">→</span>
      </div>
      ${l.description ? `<div class="list-desc">${l.description}</div>` : ''}
      <div class="list-footer" id="list-count-${l.id}">Caricamento...</div>
    </div>
  `).join('');

  lists.forEach(l => loadListCount(l.id));
}

async function loadListCount(listId) {
  const { count } = await db.from('words')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId);
  const el = document.getElementById(`list-count-${listId}`);
  if (el) el.textContent = `${count ?? 0} parole`;
}

// ── Selezione lista → pagina dettaglio ────────────────────
// FIX #7: loadWords() non chiama più renderDB() né renderHome(),
// quindi non ci sono più side effects quando siamo sulla pagina liste.
async function selectList(listId, listName) {
  selectedList = { id: listId, name: listName };
  await loadWords(listId);           // carica solo le parole della lista
  renderListDetail(listName);        // poi mostra il dettaglio (words è già pronto)
}

function renderListDetail(listName) {
  const grid = document.getElementById('lists-grid');
  grid.innerHTML = `
    <button onclick="showPage('lists')" class="btn-skip" style="margin-bottom:16px">← Tutte le liste</button>
    <div class="home-hero" style="padding-top:8px">
      <h1 style="font-size:22px">${listName}</h1>
      <p style="margin-top:4px">${words.length} parole disponibili</p>
    </div>
    <div class="mode-cards">
      <div class="mode-card" onclick="startQuizFromList('ita-eng')">
        <div class="icon">🇮🇹 → 🇬🇧</div>
        <h3>ITA → ENG</h3>
        <p>Traduci dall'italiano all'inglese</p>
      </div>
      <div class="mode-card" onclick="startQuizFromList('eng-ita')">
        <div class="icon">🇬🇧 → 🇮🇹</div>
        <h3>ENG → ITA</h3>
        <p>Traduci dall'inglese all'italiano</p>
      </div>
    </div>
  `;
}

// ── Avvio quiz da lista ───────────────────────────────────
function startQuizFromList(mode) {
  selectedMode = mode;
  startQuiz();
}