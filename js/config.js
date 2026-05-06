// ── Supabase ──────────────────────────────────────────────
const { createClient } = supabase;
const db = createClient(
  'https://nykqupvssdsmbbqpsqup.supabase.co',
  'sb_publishable_Qwouq208mA727Y9iPLhikA_9RIE2RCg'
);

// ── Utente corrente ───────────────────────────────────────
let currentUser = null;

// ── Stato globale ─────────────────────────────────────────
let words = [];
let selectedMode = null;
let quizWords = [], quizIndex = 0, quizResults = [];
let addFormOpen = false, selectedCat = 'all';

// ── Colori categorie ──────────────────────────────────────
const CAT_COLORS = {
  general:  { bg: '#1a1a2e', text: '#7c6cf0', border: '#3a3a60' },
  tech:     { bg: '#0e221e', text: '#5ce0c0', border: '#1d4a40' },
  idiom:    { bg: '#2a1a1e', text: '#f06b7c', border: '#502030' },
  business: { bg: '#1e1a0a', text: '#d4a632', border: '#4a3a10' },
  academic: { bg: '#0e1a28', text: '#4a9fe0', border: '#1a3a58' },
};

// ── Navigazione ───────────────────────────────────────────
function showPage(p) {
  ['home', 'quiz', 'db', 'login', 'profile'].forEach(x => {
    const el = document.getElementById('page-' + x);
    if (el) el.style.display = x === p ? 'block' : 'none';
  });
  document.querySelector('header').style.display = p === 'login' ? 'none' : 'flex';
  document.querySelectorAll('.nav-tabs button').forEach((b, i) => {
    b.classList.toggle('active', ['home', 'db', 'profile'][i] === p);
  });
  if (p === 'home')    { renderHome(); loadWords(); }
  if (p === 'db')      { renderDB();   loadWords(); }
  if (p === 'profile') { loadProfile(); }
}