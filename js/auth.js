// ── Inizializzazione sessione ─────────────────────────────
// Controlla se l'utente è già loggato al caricamento
db.auth.getSession().then(({ data: { session } }) => {
  currentUser = session?.user ?? null;
  if (currentUser) showPage('home');
  else showPage('login');
});

// Ascolta i cambiamenti di stato auth
db.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
});

// ── Login / Registrazione ─────────────────────────────────
let authMode = 'login';

function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById('auth-submit').textContent = mode === 'login' ? 'Accedi' : 'Registrati';
  document.getElementById('tab-login').style.background = mode === 'login' ? 'var(--accent)' : 'var(--surface)';
  document.getElementById('tab-register').style.background = mode === 'register' ? 'var(--accent)' : 'var(--surface)';
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';

  const fn = authMode === 'login'
    ? db.auth.signInWithPassword({ email, password })
    : db.auth.signUp({ email, password });

  const { error } = await fn;
  if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; return; }
  showPage('home');
}

// ── Google OAuth ──────────────────────────────────────────
async function loginWithGoogle() {
  await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
}

// ── Logout ────────────────────────────────────────────────
async function logout() {
  await db.auth.signOut();
  showPage('login');
}

db.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user ?? null;
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
    showPage('login');
  }
});