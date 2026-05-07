window.onerror = function(msg, src, line, col, err) {
  alert('ERRORE: ' + msg + '\nFile: ' + src + '\nRiga: ' + line);
};
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
let addFormOpen = false;
let selectedList = null; // null = tutte le parole

// ── Navigazione ───────────────────────────────────────────
function showPage(p) {
  ['home', 'quiz', 'db', 'login', 'profile', 'lists'].forEach(x => {
    const el = document.getElementById('page-' + x);
    if (el) el.style.display = x === p ? 'block' : 'none';
  });
  document.querySelector('header').style.display = p === 'login' ? 'none' : 'flex';
  document.querySelectorAll('.nav-tabs button').forEach((b, i) => {
    b.classList.toggle('active', ['home', 'lists', 'db', 'profile'][i] === p);
  });
  if (p === 'home')    { renderHome(); loadWords(); }
  if (p === 'lists')   { loadLists(); }
  if (p === 'db')      { renderDB(); loadWords(); }
  if (p === 'profile') { loadProfile(); }
}

let userProfile = null;

async function loadUserProfile() {
  if (!currentUser) return;
  const { data } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
  userProfile = data;
}