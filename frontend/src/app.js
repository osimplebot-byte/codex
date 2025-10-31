import api from './api.js';
import {
  initToasts,
  renderDadosView,
  renderTestDriveView,
  renderConexoesView,
  renderAjudaView,
  onboarding,
  requestBusinessData,
  saveBusinessData,
  simulateChat,
  fetchInstanceStatus,
  refreshInstance,
  disconnectInstance,
  saveInstanceSettings,
  sendSupportMessage
} from './ui.js';

const state = {
  theme: localStorage.getItem('omr:theme') || 'light',
  activeTab: localStorage.getItem('omr:last_tab') || 'dados',
  session: { user: null },
  empresa: null,
  produtos: [],
  faqs: [],
  instancia: null,
  instanciaLog: [],
  testDrive: {
    persona: 'josi',
    history: []
  },
  support: {
    history: []
  },
  onboardingIndex: 0,
  onboardingDone: localStorage.getItem('omr:onboarding_done') === 'true'
};

window.state = state;

const viewContainer = document.getElementById('viewContainer');
const tabNavigation = document.getElementById('tabNavigation');
const themeToggle = document.getElementById('themeToggle');
const logoutButton = document.getElementById('logoutButton');
const onboardingOverlay = document.getElementById('onboardingOverlay');
const onboardingStepText = document.getElementById('onboardingStepText');
const onboardingNext = document.getElementById('onboardingNext');
const onboardingSkip = document.getElementById('onboardingSkip');
const companyLabel = document.getElementById('companyLabel');

const toasts = initToasts();
let pollingInterval = null;

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('omr:theme', state.theme);
}

async function injectIcons() {
  const exists = document.getElementById('icon-sprite');
  if (exists) return;
  try {
    const response = await fetch('./src/assets/icons.svg');
    const content = await response.text();
    const wrapper = document.createElement('div');
    wrapper.id = 'icon-sprite';
    wrapper.innerHTML = content;
    document.body.prepend(wrapper);
  } catch (err) {
    console.warn('Failed to load icons', err);
  }
}

function updateCompanyLabel() {
  if (state.empresa?.nome) {
    companyLabel.textContent = state.empresa.nome;
  } else {
    companyLabel.textContent = 'Configure e conecte sua operação';
  }
}

function setActiveTab(tab) {
  state.activeTab = tab;
  localStorage.setItem('omr:last_tab', tab);
  Array.from(tabNavigation.querySelectorAll('button')).forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === tab);
  });
  renderActiveTab();
  managePolling();
}

function renderActiveTab() {
  viewContainer.innerHTML = '';
  let view;
  switch (state.activeTab) {
    case 'dados':
      view = renderDadosView(state, { onLogin: handleLogin, onSave: handleSaveEmpresa });
      break;
    case 'test-drive':
      view = renderTestDriveView(state, { onSend: handleSimMessage, onChangePersona: handlePersonaChange });
      break;
    case 'conexoes':
      view = renderConexoesView(state, {
        onRefresh: handleRefreshInstance,
        onDisconnect: handleDisconnectInstance,
        onSaveSettings: handleSaveInstanceSettings
      });
      break;
    case 'ajuda':
      view = renderAjudaView(state, { onSend: handleSupportMessage });
      break;
    default:
      view = document.createElement('div');
      view.textContent = 'Aba não encontrada.';
  }
  viewContainer.appendChild(view);
}

function managePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  if (state.activeTab === 'conexoes' && state.session.user && state.instancia?.status !== 'conectado') {
    pollingInterval = setInterval(async () => {
      try {
        const status = await fetchInstanceStatus();
        updateInstance(status);
      } catch (err) {
        console.warn('Polling error', err);
      }
    }, 5000);
  }
}

async function handleLogin({ email, password }) {
  try {
    await api.login({ email, password });
    await bootstrapSession();
    toasts.success('Sessão iniciada com sucesso.');
    renderActiveTab();
  } catch (err) {
    toasts.error(err.message ?? 'Não foi possível entrar.');
    throw err;
  }
}

async function bootstrapSession() {
  try {
    const data = await api.fetchBootstrap();
    state.session.user = data.user ?? null;
    state.empresa = data.empresa ?? null;
    state.produtos = data.produtos ?? data.empresa?.produtos ?? [];
    state.faqs = data.faqs ?? data.empresa?.faqs ?? [];
    state.instancia = Array.isArray(data.instancias) ? data.instancias[0] : data.instancias ?? null;
    state.instanciaLog = [];
    updateCompanyLabel();
    logoutButton.classList.toggle('hidden', !state.session.user);
    await fetchBusinessData();
    maybeShowOnboarding();
  } catch (err) {
    api.clearSession();
    state.session.user = null;
    throw err;
  }
}

async function fetchBusinessData() {
  if (!state.session.user) return;
  try {
    const { empresa, produtos, faqs } = await requestBusinessData();
    state.empresa = empresa ?? state.empresa ?? null;
    state.produtos = produtos ?? [];
    state.faqs = faqs ?? [];
    updateCompanyLabel();
  } catch (err) {
    console.warn('Falha ao carregar dados do negócio', err);
  }
}

async function handleSaveEmpresa(payload) {
  try {
    await saveBusinessData(payload);
    state.empresa = payload.empresa;
    state.produtos = payload.produtos;
    state.faqs = payload.faqs;
    updateCompanyLabel();
    toasts.success('Dados salvos com sucesso.');
  } catch (err) {
    toasts.error(err.message ?? 'Não foi possível salvar agora.');
    throw err;
  }
}

function handlePersonaChange(persona) {
  state.testDrive.persona = persona;
}

async function handleSimMessage(message) {
  if (!state.session.user) {
    toasts.error('Faça login para usar o simulador.');
    return;
  }
  state.testDrive.history.push({ role: 'me', content: message });
  try {
    const response = await simulateChat({ persona: state.testDrive.persona, message });
    state.testDrive.history.push({ role: 'bot', content: response.reply ?? 'Sem resposta no momento.' });
    if (response.usage) {
      const usage = `Tokens: prompt ${response.usage.prompt_tokens ?? 0} · resposta ${response.usage.completion_tokens ?? 0}`;
      state.testDrive.history.push({ role: 'bot', content: usage });
    }
  } catch (err) {
    state.testDrive.history.push({ role: 'bot', content: `Erro: ${err.message}` });
  }
}

async function handleRefreshInstance() {
  try {
    const data = await refreshInstance();
    updateInstance(data);
    addInstanceLog('Instância atualizada.');
    renderActiveTab();
  } catch (err) {
    toasts.error(err.message ?? 'Não foi possível atualizar.');
    throw err;
  }
}

async function handleDisconnectInstance() {
  try {
    await disconnectInstance();
    addInstanceLog('Instância desconectada.');
    state.instancia = { status: 'desconectado' };
    renderActiveTab();
  } catch (err) {
    toasts.error(err.message ?? 'Falha ao desconectar.');
    throw err;
  }
}

async function handleSaveInstanceSettings(payload) {
  try {
    await saveInstanceSettings(payload);
    state.instancia = state.instancia ?? {};
    state.instancia.settings = payload;
    addInstanceLog('Configurações salvas.');
    toasts.success('Instância atualizada.');
    renderActiveTab();
  } catch (err) {
    toasts.error(err.message ?? 'Não foi possível salvar.');
    throw err;
  }
}

async function handleSupportMessage(message) {
  state.support.history.push({ role: 'me', content: message });
  try {
    const data = await sendSupportMessage(message);
    const response = { role: 'bot', content: data.reply ?? 'Sem resposta no momento.' };
    if (data.escalate) {
      response.escalate = data.escalate;
    }
    state.support.history.push(response);
  } catch (err) {
    state.support.history.push({ role: 'bot', content: `Erro: ${err.message}` });
  }
}

function updateInstance(instanceData) {
  if (!instanceData) return;
  state.instancia = { ...state.instancia, ...instanceData };
  if (instanceData.status) {
    addInstanceLog(`Status: ${instanceData.status}`);
  }
  renderActiveTab();
}

function addInstanceLog(message) {
  const entry = {
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    message
  };
  state.instanciaLog = [entry, ...state.instanciaLog].slice(0, 20);
}

function maybeShowOnboarding() {
  if (state.onboardingDone || !state.session.user) {
    onboardingOverlay.classList.add('hidden');
    return;
  }
  state.onboardingIndex = 0;
  onboardingOverlay.classList.remove('hidden');
  onboardingStepText.textContent = onboarding.steps[state.onboardingIndex];
}

function advanceOnboarding() {
  state.onboardingIndex += 1;
  if (state.onboardingIndex >= onboarding.total) {
    finishOnboarding();
  } else {
    onboardingStepText.textContent = onboarding.steps[state.onboardingIndex];
  }
}

function finishOnboarding() {
  onboardingOverlay.classList.add('hidden');
  state.onboardingDone = true;
  localStorage.setItem('omr:onboarding_done', 'true');
}

async function handleLogout() {
  await api.logout();
  state.session.user = null;
  state.empresa = null;
  state.produtos = [];
  state.faqs = [];
  state.testDrive.history = [];
  state.support.history = [];
  state.instancia = null;
  state.instanciaLog = [];
  logoutButton.classList.add('hidden');
  toasts.success('Sessão encerrada.');
  renderActiveTab();
}

function setupEventListeners() {
  tabNavigation.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-tab]');
    if (!button) return;
    setActiveTab(button.dataset.tab);
  });

  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
  });

  onboardingNext.addEventListener('click', () => {
    advanceOnboarding();
  });

  onboardingSkip.addEventListener('click', () => {
    finishOnboarding();
  });

  logoutButton.addEventListener('click', handleLogout);
}

async function init() {
  await injectIcons();
  applyTheme();
  setupEventListeners();
  if (state.session.user) {
    logoutButton.classList.remove('hidden');
  }
  try {
    await bootstrapSession();
  } catch (err) {
    console.warn('Bootstrap inicial falhou', err);
  }
  renderActiveTab();
  managePolling();
}

init();
