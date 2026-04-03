/**
 * Per-tab auth: sessionStorage so multiple tabs can hold different roles
 * without overwriting each other (localStorage is shared across all tabs).
 */
const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';

function migrateLegacyLocalStorage() {
  try {
    if (sessionStorage.getItem(TOKEN_KEY)) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const role = localStorage.getItem(ROLE_KEY);
    if (!token) return;
    sessionStorage.setItem(TOKEN_KEY, token);
    if (role) sessionStorage.setItem(ROLE_KEY, role);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getToken() {
  migrateLegacyLocalStorage();
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function readAuth() {
  const token = getToken();
  if (!token) return null;
  try {
    const raw = sessionStorage.getItem(ROLE_KEY);
    const role = raw ? String(raw).toLowerCase().trim() : null;
    return { token, role };
  } catch {
    return null;
  }
}

export function setAuth(token, role) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, role);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAuth() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch {
    /* ignore */
  }
}
