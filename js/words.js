// ── Carica parole ─────────────────────────────────────────
async function loadWords(listId = null) {
  let query = db.from('words').select('*').order('id');
  if (listId) query = query.eq('list_id', listId);
  const { data, error } = await query;
  if (error) { console.error(error); return; }
  words = data;
  renderHome();
  renderDB();
}

// ── Aggiungi parola ───────────────────────────────────────
async function addWord() {
  const eng = document.getElementById('f-eng').value.trim();
  const ita = document.getElementById('f-ita').value.trim();
  const ctx = document.getElementById('f-ctx').value.trim();
  
  if (!eng || !ita) return;

  const { data, error } = await db.from('words').insert({ eng, ita, ctx }).select();
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
    !q || w.eng.toLowerCase().includes(q) || w.ita.toLowerCase().includes(q)
  );
  const list = document.getElementById('word-list');
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">Nessuna parola trovata.<br>Aggiungine una nuova!</div>`;
    return;
  }
  list.innerHTML = filtered.map(w => `
    <div class="word-row">
      <span class="eng-w">${w.eng}</span>
      <span class="ita-w">${w.ita}</span>
      ${w.ctx ? `<span class="ctx-w">"${w.ctx}"</span>` : '<span class="ctx-w"></span>'}
      <button class="btn-del" onclick="deleteWord(${w.id})">✕</button>
    </div>
  `).join('');
}

// ── Toggle form aggiunta ──────────────────────────────────
function toggleAddForm() {
  addFormOpen = !addFormOpen;
  document.getElementById('add-form').classList.toggle('open', addFormOpen);
  if (addFormOpen) document.getElementById('f-eng').focus();
}

async function renderHome() {
  // Saluto da profiles
  const name = userProfile?.name || 'there';
  const greetings = [
    `Ciao ${name}, sei carico? 💪`,
    `Bentornato ${name}! 🚀`,
    `Pronto ad allenarti, ${name}? 🎯`,
    `Ehi ${name}, si impara! 📚`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  document.getElementById('home-greeting').innerHTML = greeting;

  // Stats
  let acc = 0;
  if (currentUser) {
    const { data } = await db.from('sessions')
      .select('correct, wrong')
      .eq('user_id', currentUser.id);
    if (data?.length) {
      const tot_c = data.reduce((s, r) => s + r.correct, 0);
      const tot_w = data.reduce((s, r) => s + r.wrong, 0);
      acc = tot_c + tot_w > 0 ? Math.round(tot_c / (tot_c + tot_w) * 100) : 0;
    }
  }
  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card"><div class="num">${words.length}</div><div class="lbl">Parole</div></div>
    <div class="stat-card"><div class="num">${acc}%</div><div class="lbl">Accuracy</div></div>
  `;
}
