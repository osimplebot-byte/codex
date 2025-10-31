const API_BASE = '/api';

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  const auth = window.state?.user?.session;
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  return headers;
}

async function request(path, { method = 'GET', body } = {}) {
  const url = `${API_BASE}/${path.replace(/^\//, '')}`;
  console.groupCollapsed('[OMR:API]');
  console.log('Action:', path);
  console.log('Method:', method);
  console.log('Body:', body);
  console.groupEnd();

  try {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({ ok: false, error: { code: 'INVALID_JSON', message: 'Resposta inválida.' } }));

    if (!response.ok || data.ok === false) {
      const error = data.error || { code: 'INTERNAL_ERROR', message: 'Erro desconhecido.' };
      window.dispatchEvent(new CustomEvent('api:error', { detail: error }));
      if (error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_INVALID') {
        window.dispatchEvent(new CustomEvent('auth:invalid'));
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[OMR:API] Falha de requisição', error);
    throw error;
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, payload) => request(path, { method: 'POST', body: payload }),
  put: (path, payload) => request(path, { method: 'PUT', body: payload }),
};

export function logEvent(type, detail) {
  console.log('[OMR:LOG]', { type, detail, ts: Date.now() });
}
