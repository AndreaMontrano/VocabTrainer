// ── Supabase ──────────────────────────────────────────────
const { createClient } = supabase;
const db = createClient(
  'https://nykqupvssdsmbbqpsqup.supabase.co',
  'sb_publishable_Qwouq208mA727Y9iPLhikA_9RIE2RCg'
);

// ── Utente corrente ───────────────────────────────────────
let currentUser = null;
let userProfile = null;

// ── Stato globale ─────────────────────────────────────────
let words = [];
let selectedMode = null;
let quizWords = [], quizIndex = 0, quizResults = [];
let selectedList = null;

// ── Navigazione ───────────────────────────────────────────
function showPage(p) {
  ['home', 'quiz', 'lists', 'login', 'profile'].forEach(x => {
    const el = document.getElementById('page-' + x);
    if (el) el.style.display = x === p ? 'block' : 'none';
  });

  document.querySelector('header').style.display = p === 'login' ? 'none' : 'flex';

  document.querySelectorAll('.nav-tabs button').forEach((b, i) => {
    b.classList.toggle('active', ['home', 'lists', 'profile'][i] === p);
  });

  if (p === 'home') {
    // FIX #5: reset selectedList quando si torna alla home,
    // così loadWords() carica tutte le parole senza filtro stale
    selectedList = null;
    loadWordsAndRenderHome();
  }
  if (p === 'lists')   { loadLists(); }
  if (p === 'profile') { loadProfile(); }
}

// FIX #9: unica funzione async che aspetta loadWords prima di renderHome,
// elimina il double-render con stats a 0 visibili per un frame
async function loadWordsAndRenderHome() {
  await loadWords();
  await renderHome();
}

async function loadUserProfile() {
  if (!currentUser) return;
  const { data } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
  userProfile = data;
}