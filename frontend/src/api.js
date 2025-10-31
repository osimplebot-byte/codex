const API_URL = '/webhook/api-backend';

function getStoredSession() {
  try {
    const userId = localStorage.getItem('omr:user_id');
    const sessionToken = localStorage.getItem('omr:session_token');
    if (userId && sessionToken) {
      return { user_id: userId, session_token: sessionToken };
    }
  } catch (err) {
    console.warn('Failed to read session from storage', err);
  }
  return null;
}

export function storeSession({ user_id, session_token }) {
  localStorage.setItem('omr:user_id', user_id);
  localStorage.setItem('omr:session_token', session_token);
}

export function clearSession() {
  localStorage.removeItem('omr:user_id');
  localStorage.removeItem('omr:session_token');
}

export async function post(action, payload = {}, { auth = true, signal } = {}) {
  const session = auth ? getStoredSession() : null;
  const body = {
    action,
    auth: session ?? undefined,
    payload
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal
  });

  const json = await response.json().catch(() => ({ ok: false, error: { message: 'Resposta inválida do servidor' } }));
  if (!response.ok || json.ok === false) {
    const message = json?.error?.message ?? response.statusText ?? 'Erro inesperado';
    throw new Error(message);
  }

  return json.data ?? {};
}

export async function login({ email, password }) {
  const data = await post('auth.login', { email, password }, { auth: false });
  storeSession(data);
  return data;
}

export async function logout() {
  try {
    await post('auth.logout', {}, { auth: true });
  } catch (err) {
    console.warn('Failed to logout gracefully', err);
  } finally {
    clearSession();
  }
}

export async function fetchBootstrap() {
  return post('auth.me', {});
}

export const api = {
  post,
  login,
  logout,
  fetchBootstrap,
  storeSession,
  clearSession
};

export default api;
