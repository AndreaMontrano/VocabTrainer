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
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
        <div class="list-footer" id="list-count-${l.id}">Caricamento...</div>
        <div style="font-size:11px;color:var(--accent2);font-family:var(--mono)" id="list-seen-${l.id}"></div>
      </div>
      <div style="margin-top:8px;height:3px;background:var(--border);border-radius:2px;overflow:hidden">
        <div id="list-progress-${l.id}"
          style="height:100%;background:var(--accent);border-radius:2px;width:0%;transition:width 0.5s ease"></div>
      </div>
    </div>
  `).join('');

  lists.forEach(l => loadListStats(l.id));
}

// ── Carica stats per singola lista (count + progresso) ────
async function loadListStats(listId) {
  // Totale parole nella lista
  const { count: total } = await db.from('words')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId);

  const countEl    = document.getElementById(`list-count-${listId}`);
  const progressEl = document.getElementById(`list-progress-${listId}`);
  const seenEl     = document.getElementById(`list-seen-${listId}`);

  if (countEl) countEl.textContent = `${total ?? 0} parole`;

  // Parole viste dall'utente per questa lista
  if (currentUser && total > 0) {
    const { count: seen } = await db.from('user_word_seen')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .eq('list_id', listId);

    const seenCount = seen ?? 0;
    const pct = Math.round(seenCount / total * 100);

    if (progressEl) progressEl.style.width = `${pct}%`;

    if (seenEl) {
      if (seenCount === 0) {
        seenEl.textContent = '';
      } else if (seenCount >= total) {
        seenEl.textContent = '✓ completata';
        seenEl.style.color = 'var(--success)';
      } else {
        seenEl.textContent = `${seenCount}/${total} viste`;
      }
    }
  }
}

// ── Selezione lista → pagina dettaglio ────────────────────
async function selectList(listId, listName) {
  selectedList = { id: listId, name: listName };
  await loadWords(listId);
  renderListDetail(listName);
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