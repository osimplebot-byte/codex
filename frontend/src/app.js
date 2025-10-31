import { api, logEvent } from './api.js';
import { renderTab, tabOrder, showToast } from './ui.js';

const DEFAULT_TAB = 'dados';
const spriteHost = document.getElementById('sprite-host');

window.state = {
  user: null,
  theme: localStorage.getItem('theme') || 'light',
  activeTab: localStorage.getItem('activeTab') || DEFAULT_TAB,
  dados_cache: {},
  isLoading: {},
};

document.documentElement.setAttribute('data-theme', window.state.theme);

async function loadIconSprite() {
  if (!spriteHost) return;
  if (spriteHost.dataset.loaded) return;
  try {
    const response = await fetch('src/assets/icons.svg');
    const markup = await response.text();
    spriteHost.innerHTML = markup;
    spriteHost.dataset.loaded = 'true';
  } catch (error) {
    console.warn('[OMR:APP] Ícones não carregados', error);
  }
}

function setTheme(theme) {
  window.state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  logEvent('theme.change', { theme });
}

function setActiveTab(tab) {
  if (!tabOrder.includes(tab)) {
    tab = DEFAULT_TAB;
  }
  window.state.activeTab = tab;
  localStorage.setItem('activeTab', tab);
  if (location.hash.replace('#', '') !== tab) {
    location.hash = `#${tab}`;
  }
  updateNav();
  renderTab(window.state, tab);
}

function updateNav() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    const tab = btn.dataset.tab;
    btn.classList.toggle('active', tab === window.state.activeTab);
    btn.disabled = !window.state.user;
  });
}

function setupListeners() {
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    setTheme(window.state.theme === 'light' ? 'dark' : 'light');
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    logout();
  });

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      setActiveTab(tab);
    });
  });

  window.addEventListener('hashchange', () => {
    const tab = location.hash.replace('#', '') || DEFAULT_TAB;
    if (tab !== window.state.activeTab) {
      window.state.activeTab = tab;
      renderTab(window.state, tab);
      updateNav();
    }
  });

  window.addEventListener('api:error', (event) => {
    showToast(event.detail.message || 'Erro inesperado', 'error');
  });

  window.addEventListener('auth:invalid', logout);
  window.addEventListener('state:update', () => renderTab(window.state, window.state.activeTab));
}

async function login(email, password) {
  try {
    const response = await api.post('auth/login', {
      action: 'auth.login',
      payload: { email, password },
    });
    window.state.user = response.data;
    localStorage.setItem('session', JSON.stringify(response.data));
    logEvent('auth.login', { email });
    showToast('Login realizado');
    await bootstrap();
  } catch (error) {
    showToast(error.message || 'Erro ao autenticar', 'error');
    throw error;
  }
}

function logout() {
  window.state.user = null;
  window.state.dados_cache = {};
  localStorage.removeItem('session');
  showToast('Sessão finalizada');
  renderLogin();
  updateNav();
}

function bottomNav() {
  return document.querySelector('.bottom-nav');
}

function renderLogin() {
  const view = document.getElementById('view');
  view.innerHTML = `
    <section class="card">
      <h2>Entrar</h2>
      <form id="login-form">
        <label>E-mail</label>
        <input name="email" type="email" required placeholder="founder@omelhorrobo.site" />
        <label>Senha</label>
        <input name="password" type="password" required placeholder="••••••••" />
        <button class="primary" type="submit" id="login-submit">Acessar</button>
      </form>
    </section>
  `;

  bottomNav()?.classList.add('hidden');

  const form = document.getElementById('login-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = document.getElementById('login-submit');
    submit.disabled = true;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    try {
      await login(email, password);
    } finally {
      submit.disabled = false;
    }
  });
}

async function bootstrap() {
  bottomNav()?.classList.remove('hidden');
  updateNav();
  await Promise.all([fetchDadosBase(), fetchPersonaAtiva(), fetchInstanciaStatus()]);
  renderTab(window.state, window.state.activeTab);
}

async function fetchDadosBase() {
  try {
    const response = await api.post('dados/bootstrap', {
      action: 'dados.bootstrap',
      auth: window.state.user,
    });
    window.state.dados_cache = {
      ...window.state.dados_cache,
      empresa: response.data.empresa,
      produtos: response.data.produtos,
      faqs: response.data.faqs,
    };
  } catch (error) {
    console.warn('[OMR:APP] Falha ao carregar dados base', error);
  }
}

async function fetchPersonaAtiva() {
  try {
    const response = await api.post('dados/persona', {
      action: 'dados.persona',
      auth: window.state.user,
    });
    window.state.dados_cache.persona = response.data.persona;
  } catch (error) {
    console.warn('[OMR:APP] Persona não encontrada', error);
  }
}

async function fetchInstanciaStatus() {
  try {
    const response = await api.post('instancia/status', {
      action: 'instancia.status',
      auth: window.state.user,
    });
    window.state.dados_cache.instancia = response.data;
    if (response.data.status) {
      localStorage.setItem('inst_status', response.data.status);
    }
  } catch (error) {
    console.warn('[OMR:APP] Status da instância indisponível', error);
  }
}

function hydrateSession() {
  const session = localStorage.getItem('session');
  if (session) {
    try {
      window.state.user = JSON.parse(session);
    } catch (error) {
      console.error('[OMR:APP] Sessão inválida', error);
    }
  }
}

async function init() {
  await loadIconSprite();
  setupListeners();
  hydrateSession();
  updateNav();

  if (!window.state.user) {
    renderLogin();
    return;
  }

  const tabFromHash = location.hash.replace('#', '');
  if (tabFromHash && tabOrder.includes(tabFromHash)) {
    window.state.activeTab = tabFromHash;
  }

  await bootstrap();
}

init();
