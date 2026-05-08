// ── Login / Registrazione ─────────────────────────────────
let authMode = 'login';

function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById('auth-submit').textContent = mode === 'login' ? 'Accedi' : 'Registrati';
  document.getElementById('tab-login').style.background    = mode === 'login'    ? 'var(--accent)' : 'var(--surface)';
  document.getElementById('tab-register').style.background = mode === 'register' ? 'var(--accent)' : 'var(--surface)';
  document.getElementById('auth-name').style.display = mode === 'register' ? 'block' : 'none';
}

async function handleAuth() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();
  const errEl    = document.getElementById('auth-error');
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
}

// ── Gestione utente autenticato ───────────────────────────
// FIX #2 + #3: estratta in funzione unica per evitare doppia esecuzione.
// La deduplicazione avviene tramite lastHandledUserId: se INITIAL_SESSION e
// SIGNED_IN scattano entrambi per lo stesso utente (comportamento standard
// di Supabase v2 su refresh e dopo redirect OAuth), il secondo viene ignorato.
// Quando l'utente fa logout e poi login, lastHandledUserId viene resettato
// a null in SIGNED_OUT, quindi il successivo SIGNED_IN viene processato correttamente.

let lastHandledUserId = null;

async function handleAuthUser(user) {
  // Stesso utente già gestito in questa sessione browser → skip
  if (lastHandledUserId === user.id) return;
  lastHandledUserId = user.id;

  currentUser = user;
  await loadUserProfile();

  // Crea profilo se non esiste ancora (primo accesso o nuovo utente OAuth)
  if (!userProfile) {
    const name = user.user_metadata?.full_name
      || user.email?.split('@')[0]
      || 'Utente';
    await db.from('profiles').insert({ id: user.id, name });
    await loadUserProfile();
  }

  showPage('home');
}

// ── Listener principale auth ──────────────────────────────
db.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth event:', event);

  if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
    if (session?.user) {
      await handleAuthUser(session.user);
    } else if (event === 'INITIAL_SESSION') {
      // Nessuna sessione all'avvio → mostra login
      showPage('login');
    }
    return;
  }

  if (event === 'SIGNED_OUT') {
    // FIX: reset lastHandledUserId così il prossimo login viene processato
    lastHandledUserId = null;
    currentUser = null;
    userProfile = null;
    showPage('login');
  }
});