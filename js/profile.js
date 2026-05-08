// ── Carica profilo ────────────────────────────────────────
async function loadProfile() {
  if (!currentUser) return;

  const { data: sessions } = await db.from('sessions')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('played_at', { ascending: false });

  const { data: wrongWords } = await db.from('wrong_answers')
    .select('count, word_id, words(eng, ita)')
    .eq('user_id', currentUser.id)
    .order('count', { ascending: false })
    .limit(10);

  renderProfile(sessions, wrongWords);
}

// ── Render profilo ────────────────────────────────────────
function renderProfile(sessions, wrongWords) {
  document.getElementById('profile-email').textContent = userProfile?.name || currentUser?.email || '';

  const totalSessions = sessions?.length || 0;
  const totalCorrect = sessions?.reduce((s, r) => s + r.correct, 0) || 0;
  const totalWrong = sessions?.reduce((s, r) => s + r.wrong, 0) || 0;
  const acc = totalCorrect + totalWrong > 0
    ? Math.round(totalCorrect / (totalCorrect + totalWrong) * 100) : 0;

  const sessionRows = sessions?.length ? sessions.map(s => `
    <div class="result-row">
      <div class="dot ok"></div>
      <div style="flex:1;font-size:13px">${new Date(s.played_at).toLocaleDateString('it-IT')}</div>
      <div style="font-size:12px;color:var(--muted)">${s.mode}</div>
      <div style="font-family:var(--mono);font-size:13px;margin-left:auto">
        <span style="color:var(--success)">${s.correct}</span>
        <span style="color:var(--muted)">/${s.total}</span>
      </div>
    </div>
  `).join('') : '<div class="empty-state">Nessuna sessione ancora</div>';

  const wrongRows = wrongWords?.length ? wrongWords.map(w => `
    <div class="result-row">
        <div class="dot ko"></div>
        <div style="font-family:var(--mono);font-weight:700;min-width:120px">${w.words?.eng}</div>
        <div style="color:var(--muted);font-size:13px;flex:1">${w.words?.ita}</div>
        <div style="font-family:var(--mono);font-size:12px;color:var(--danger)">×${w.count}</div>
    </div>
    `).join('') : '<div class="empty-state">Nessun errore registrato</div>';

  document.getElementById('profile-content').innerHTML = `
    <div class="stats-row" style="margin-bottom:20px">
      <div class="stat-card"><div class="num">${totalSessions}</div><div class="lbl">Sessioni</div></div>
      <div class="stat-card"><div class="num">${acc}%</div><div class="lbl">Accuracy</div></div>
      <div class="stat-card"><div class="num">${totalCorrect}</div><div class="lbl">Corrette</div></div>
    </div>
    <p style="font-family:var(--mono);font-size:12px;color:var(--muted);margin-bottom:10px">STORICO SESSIONI</p>
    <div class="results-list" style="margin-bottom:24px">${sessionRows}</div>
    <p style="font-family:var(--mono);font-size:12px;color:var(--muted);margin-bottom:10px">PAROLE PIÙ SBAGLIATE</p>
    <div class="results-list">${wrongRows}</div>
  `;
}