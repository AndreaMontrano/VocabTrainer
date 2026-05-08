// ── Carica parole ─────────────────────────────────────────
async function loadWords(listId = null) {
  let query = db.from('words').select('*').order('id');
  if (listId) query = query.eq('list_id', listId);
  const { data, error } = await query;
  if (error) { console.error(error); return; }
  words = data;
  // FIX #7: rimosso renderDB() (page-db è stato rimosso) e renderHome()
  // (ora chiamata esplicitamente da loadWordsAndRenderHome in config.js)
}

// ── Render home ───────────────────────────────────────────
// FIX #9: ora è chiamata dopo await loadWords(), quindi words è già popolato
// FIX #8: aggiunta terza stat card (Sessioni) per riempire il grid a 3 colonne
async function renderHome() {
  // FIX #1: ora home-greeting esiste nel DOM (fix in index.html)
  const greetingEl = document.getElementById('home-greeting');
  if (!greetingEl) return; // guard: se non siamo sulla home, esci

  const name = userProfile?.name || 'there';
  const greetings = [
    `Ciao ${name}, sei carico? 💪`,
    `Bentornato ${name}! 🚀`,
    `Pronto ad allenarti, ${name}? 🎯`,
    `Ehi ${name}, si impara! 📚`,
  ];
  greetingEl.innerHTML = greetings[Math.floor(Math.random() * greetings.length)];

  let acc = 0;
  let totalSessions = 0;
  if (currentUser) {
    const { data } = await db.from('sessions')
      .select('correct, wrong')
      .eq('user_id', currentUser.id);
    if (data?.length) {
      totalSessions = data.length;
      const tot_c = data.reduce((s, r) => s + r.correct, 0);
      const tot_w = data.reduce((s, r) => s + r.wrong, 0);
      acc = tot_c + tot_w > 0 ? Math.round(tot_c / (tot_c + tot_w) * 100) : 0;
    }
  }

  const statsRow = document.getElementById('stats-row');
  if (!statsRow) return;
  statsRow.innerHTML = `
    <div class="stat-card"><div class="num">${words.length}</div><div class="lbl">Parole</div></div>
    <div class="stat-card"><div class="num">${acc}%</div><div class="lbl">Accuracy</div></div>
    <div class="stat-card"><div class="num">${totalSessions}</div><div class="lbl">Sessioni</div></div>
  `;
}