// ── Login / Registrazione ─────────────────────────────────
let authMode = 'login';

function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById('auth-submit').textContent = mode === 'login' ? 'Accedi' : 'Registrati';
  document.getElementById('tab-login').style.background = mode === 'login' ? 'var(--accent)' : 'var(--surface)';
  document.getElementById('tab-register').style.background = mode === 'register' ? 'var(--accent)' : 'var(--surface)';
  document.getElementById('auth-name').style.display = mode === 'register' ? 'block' : 'none';
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';

  if (authMode === 'register') {
    const name = document.getElementById('auth-name').value.trim();
    if (!name) {
      errEl.textContent = 'Inserisci il tuo nome';
      errEl.style.display = 'block';
      return;
    }
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; return; }
    if (data?.user) {
      await db.from('profiles').insert({ id: data.user.id, name });
    }
  } else {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; return; }
  }
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
  currentUser = null;
  userProfile = null;
  showPage('login');
}

// ── Gestione sessione — UN SOLO listener ──────────────────
db.auth.getSession().then(async ({ data: { session } }) => {
  currentUser = session?.user ?? null;
  if (currentUser) {
    await loadUserProfile();
    showPage('home');
  } else {
    showPage('login');
  }
});

db.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    currentUser = session.user;
    await loadUserProfile();
    showPage('home');
  }
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    userProfile = null;
    showPage('login');
  }
});