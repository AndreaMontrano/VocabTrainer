// ── Carica profilo ────────────────────────────────────────
async function loadProfile() {
  if (!currentUser) return;

  // Includi list_id e il nome della lista
  const { data: sessions } = await db.from('sessions')
    .select('*, lists(name)')
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

  // ── Breakdown per lista ────────────────────────────────
  const byList = {};
  sessions?.forEach(s => {
    if (!s.list_id) return;
    if (!byList[s.list_id]) {
      byList[s.list_id] = {
        name: s.lists?.name || 'Lista sconosciuta',
        sessions: []
      };
    }
    byList[s.list_id].sessions.push(s);
  });

  const listEntries = Object.values(byList);
  // Ordina per numero di sessioni decrescente
  listEntries.sort((a, b) => b.sessions.length - a.sessions.length);

  const listBreakdownRows = listEntries.length
    ? listEntries.map(({ name, sessions: ls }) => {
        const c = ls.reduce((a, s) => a + s.correct, 0);
        const w = ls.reduce((a, s) => a + s.wrong, 0);
        const a = c + w > 0 ? Math.round(c / (c + w) * 100) : 0;
        const barPct = a;
        const barColor = a >= 80
          ? 'var(--success)'
          : a >= 50
            ? 'var(--accent)'
            : 'var(--danger)';
        return `
          <div class="result-row" style="flex-direction:column;align-items:flex-start;gap:8px">
            <div style="display:flex;width:100%;align-items:center;gap:10px">
              <div style="font-family:var(--mono);font-size:13px;font-weight:700;flex:1">${name}</div>
              <div style="font-size:12px;color:var(--muted)">${ls.length} sess.</div>
              <div style="font-family:var(--mono);font-size:13px;color:${barColor};min-width:38px;text-align:right">${a}%</div>
            </div>
            <div style="width:100%;height:3px;background:var(--border);border-radius:2px;overflow:hidden">
              <div style="width:${barPct}%;height:100%;background:${barColor};border-radius:2px;transition:width 0.4s"></div>
            </div>
            <div style="font-size:11px;color:var(--muted)">${c} corrette · ${w} sbagliate</div>
          </div>
        `;
      }).join('')
    : '<div class="empty-state">Completa almeno un quiz da una lista per vedere il breakdown</div>';

  // ── Storico sessioni ───────────────────────────────────
  const SESS_LIMIT  = 5;
  const allSessions = sessions ?? [];

  const sessionPreviewRows = allSessions.slice(0, SESS_LIMIT).map(s => `
    <div class="result-row">
      <div class="dot ok"></div>
      <div style="flex:1;font-size:13px">${new Date(s.played_at).toLocaleDateString('it-IT')}</div>
      ${s.lists?.name
        ? `<div style="font-size:12px;color:var(--accent2);font-family:var(--mono)">${s.lists.name}</div>`
        : ''}
      <div style="font-size:12px;color:var(--muted);margin-left:8px">${s.mode}</div>
      <div style="font-family:var(--mono);font-size:13px;margin-left:auto">
        <span style="color:var(--success)">${s.correct}</span>
        <span style="color:var(--muted)">/${s.total}</span>
      </div>
    </div>
  `).join('');

  const sessionExtraRows = allSessions.slice(SESS_LIMIT).map(s => `
    <div class="result-row">
      <div class="dot ok"></div>
      <div style="flex:1;font-size:13px">${new Date(s.played_at).toLocaleDateString('it-IT')}</div>
      ${s.lists?.name
        ? `<div style="font-size:12px;color:var(--accent2);font-family:var(--mono)">${s.lists.name}</div>`
        : ''}
      <div style="font-size:12px;color:var(--muted);margin-left:8px">${s.mode}</div>
      <div style="font-family:var(--mono);font-size:13px;margin-left:auto">
        <span style="color:var(--success)">${s.correct}</span>
        <span style="color:var(--muted)">/${s.total}</span>
      </div>
    </div>
  `).join('');

  const sessionsHTML = allSessions.length
    ? `
      ${sessionPreviewRows}
      ${sessionExtraRows
        ? `<div id="extra-sessions" style="display:none">${sessionExtraRows}</div>
           <button class="btn-skip" id="btn-toggle-sessions"
             onclick="toggleExtra('sessions', ${allSessions.length - SESS_LIMIT})"
             style="width:100%;margin-top:8px;text-align:center">
             Mostra altre ${allSessions.length - SESS_LIMIT} sessioni ↓
           </button>`
        : ''}
    `
    : '<div class="empty-state">Nessuna sessione ancora</div>';

  // ── Parole più sbagliate ───────────────────────────────
  const WRONG_LIMIT   = 5;
  const allWrong      = wrongWords ?? [];

  const wrongPreviewRows = allWrong.slice(0, WRONG_LIMIT).map(w => `
    <div class="result-row">
      <div class="dot ko"></div>
      <div style="font-family:var(--mono);font-weight:700;min-width:120px">${w.words?.eng}</div>
      <div style="color:var(--muted);font-size:13px;flex:1">${w.words?.ita}</div>
      <div style="font-family:var(--mono);font-size:12px;color:var(--danger)">×${w.count}</div>
    </div>
  `).join('');

  const wrongExtraRows = allWrong.slice(WRONG_LIMIT).map(w => `
    <div class="result-row">
      <div class="dot ko"></div>
      <div style="font-family:var(--mono);font-weight:700;min-width:120px">${w.words?.eng}</div>
      <div style="color:var(--muted);font-size:13px;flex:1">${w.words?.ita}</div>
      <div style="font-family:var(--mono);font-size:12px;color:var(--danger)">×${w.count}</div>
    </div>
  `).join('');

  const wrongHTML = allWrong.length
    ? `
      ${wrongPreviewRows}
      ${wrongExtraRows
        ? `<div id="extra-wrong" style="display:none">${wrongExtraRows}</div>
           <button class="btn-skip" id="btn-toggle-wrong"
             onclick="toggleExtra('wrong', ${allWrong.length - WRONG_LIMIT})"
             style="width:100%;margin-top:8px;text-align:center">
             Mostra altre ${allWrong.length - WRONG_LIMIT} parole ↓
           </button>`
        : ''}
    `
    : '<div class="empty-state">Nessun errore registrato</div>';

  document.getElementById('profile-content').innerHTML = `
    <div class="stats-row" style="margin-bottom:20px">
      <div class="stat-card"><div class="num">${totalSessions}</div><div class="lbl">Sessioni</div></div>
      <div class="stat-card"><div class="num">${acc}%</div><div class="lbl">Accuracy</div></div>
      <div class="stat-card"><div class="num">${totalCorrect}</div><div class="lbl">Corrette</div></div>
    </div>

    <p style="font-family:var(--mono);font-size:12px;color:var(--muted);margin-bottom:10px">STATISTICHE PER LISTA</p>
    <div class="results-list" style="margin-bottom:24px">${listBreakdownRows}</div>

    <p style="font-family:var(--mono);font-size:12px;color:var(--muted);margin-bottom:10px">STORICO SESSIONI</p>
    <div class="results-list" style="margin-bottom:24px">${sessionsHTML}</div>

    <p style="font-family:var(--mono);font-size:12px;color:var(--muted);margin-bottom:10px">PAROLE PIÙ SBAGLIATE</p>
    <div class="results-list">${wrongHTML}</div>
  `;
}

// ── Toggle espandi/collassa sezioni profilo ───────────────
function toggleExtra(section, count) {
  const extraEl  = document.getElementById(`extra-${section}`);
  const btnEl    = document.getElementById(`btn-toggle-${section}`);
  const isHidden = extraEl.style.display === 'none';

  extraEl.style.display = isHidden ? 'contents' : 'none';
  btnEl.textContent = isHidden
    ? 'Mostra meno ↑'
    : (section === 'sessions'
        ? `Mostra altre ${count} sessioni ↓`
        : `Mostra altre ${count} parole ↓`);
}