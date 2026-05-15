// ── Avvio quiz ────────────────────────────────────────────
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function startQuiz() {
  if (!selectedMode || words.length === 0) return;
  quizWords  = shuffle(words).slice(0, Math.min(10, words.length));
  quizIndex  = 0;
  quizResults = [];
  showPage('quiz');
  renderQuiz();
}

// ── Render domanda ────────────────────────────────────────
function renderQuiz() {
  const area = document.getElementById('quiz-area');
  if (quizIndex >= quizWords.length) {
    showResults(area);
    return;
  }
  const w    = quizWords[quizIndex];
  const isIE = selectedMode === 'ita-eng';
  const question = isIE ? w.ita.split(',')[0].trim() : w.eng;
  const pct  = Math.round((quizIndex / quizWords.length) * 100);

  area.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-mode-badge">${isIE ? 'ITA → ENG' : 'ENG → ITA'}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="quiz-count">${quizIndex + 1}/${quizWords.length}</div>
    </div>
    <div class="card-q">
      <div class="word">${question}</div>
      ${w.ctx ? `<div class="context">"${w.ctx}"</div>` : ''}
    </div>
    <input class="answer-input" id="ans-input"
      placeholder="${isIE ? 'Scrivi in inglese...' : 'Scrivi in italiano...'}"
      autocomplete="off" autocorrect="off" spellcheck="false">
    <div class="feedback-box" id="feedback"></div>
    <div class="quiz-actions">
      <button class="btn-check" id="btn-check" onclick="checkAnswer()">Controlla</button>
      <button class="btn-skip" onclick="nextWord()">Salta →</button>
    </div>
  `;

  const inp = document.getElementById('ans-input');
  inp.focus();
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const btn = document.getElementById('btn-check');
      if (btn.textContent === 'Controlla') checkAnswer();
      else nextWord();
    }
  });
}

// ── Normalizzazione ───────────────────────────────────────
function normalize(s) {
  return s.toLowerCase().trim()
    .replace(/[àáâ]/g, 'a').replace(/[èéê]/g, 'e')
    .replace(/[ìíî]/g, 'i').replace(/[òóô]/g, 'o')
    .replace(/[ùúû]/g, 'u');
}

// ── Controllo risposta ────────────────────────────────────
function checkAnswer() {
  const w      = quizWords[quizIndex];
  const isIE   = selectedMode === 'ita-eng';
  const correct = isIE ? w.eng : w.ita;
  const inp    = document.getElementById('ans-input');
  const userAns = inp.value.trim();
  if (!userAns) return;

  const correctVariants = correct.split(',').map(s => normalize(s.trim()));
  const ok = correctVariants.some(v => normalize(userAns) === v);

  const fb = document.getElementById('feedback');
  inp.classList.add(ok ? 'correct' : 'wrong');
  fb.className = 'feedback-box show ' + (ok ? 'correct' : 'wrong');
  fb.innerHTML = ok
    ? `<span>✓</span> Corretto!`
    : `<span>✗</span> Risposta: <strong style="margin-left:4px;font-family:var(--mono)">${correct}</strong>`;

  const btn = document.getElementById('btn-check');
  btn.textContent = 'Prossima →';
  btn.onclick = nextWord;

  quizResults.push({ word: w, ok, userAns });
}

function nextWord() {
  quizIndex++;
  renderQuiz();
}

// ── Risultati ─────────────────────────────────────────────
async function showResults(area) {
  const tot = quizResults.length;
  const ok  = quizResults.filter(r => r.ok).length;

  if (currentUser) {
    // Rate limit: max 10 sessioni nell'ultimo minuto
    const { count } = await db.from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .gte('played_at', new Date(Date.now() - 60000).toISOString());

    if (count >= 10) {
      console.warn('Troppi quiz in poco tempo, sessione non salvata');
    } else {
      // Salva sessione con list_id
      await db.from('sessions').insert({
        user_id: currentUser.id,
        mode:    selectedMode,
        list_id: selectedList?.id || null,   // ← NUOVO
        correct: ok,
        wrong:   tot - ok,
        total:   tot
      });

      // Marca tutte le parole come viste (upsert: non sovrascrive first_seen_at se già esiste)
      if (quizResults.length > 0) {
        const seenRows = quizResults.map(r => ({
          user_id:  currentUser.id,
          word_id:  r.word.id,
          list_id:  r.word.list_id
        }));
        await db.from('user_word_seen')
          .upsert(seenRows, { onConflict: 'user_id,word_id', ignoreDuplicates: true });
      }

      // Incrementa contatore parole sbagliate
      const wrongWords = quizResults.filter(r => !r.ok);
      for (const r of wrongWords) {
        const { data: existing } = await db.from('wrong_answers')
          .select('count')
          .eq('user_id', currentUser.id)
          .eq('word_id', r.word.id)
          .maybeSingle();

        const newCount = (existing?.count ?? 0) + 1;

        await db.from('wrong_answers').upsert(
          {
            user_id:   currentUser.id,
            word_id:   r.word.id,
            count:     newCount,
            last_seen: new Date().toISOString()
          },
          { onConflict: 'user_id,word_id' }
        );
      }
    }
  }

  const pct  = tot > 0 ? Math.round(ok / tot * 100) : 0;
  const rows = quizResults.map(r => `
    <div class="result-row">
      <div class="dot ${r.ok ? 'ok' : 'ko'}"></div>
      <div class="ita">${r.word.ita.split(',')[0].trim()}</div>
      <div class="arrow">→</div>
      <div class="eng">${r.word.eng}</div>
      ${!r.ok ? `<div class="your">tu: ${r.userAns || '—'}</div>` : ''}
    </div>
  `).join('');

  area.innerHTML = `
    <div class="results-box">
      <div class="score"><span>${ok}</span>/${tot}</div>
      <p style="color:var(--muted);font-size:14px;margin-top:6px">${pct}% di risposte corrette</p>
      <button class="btn-start" onclick="startQuiz()" style="margin-top:20px">Rifai il test</button>
      <button class="btn-skip" onclick="showPage('home')"
        style="margin-top:8px;width:100%;display:block;text-align:center">Torna alla home</button>
    </div>
    <div class="results-list">${rows}</div>
  `;
}