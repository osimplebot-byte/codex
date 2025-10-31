import api from './api.js';

const onboardingSteps = [
  'Preencha os dados do negócio na aba Dados.',
  'Teste o fluxo no simulador em Test-Drive.',
  'Conecte sua instância do WhatsApp em Conexões.'
];

const suggestions = [
  'Quais produtos vocês oferecem?',
  'Qual o horário de funcionamento?',
  'Posso falar com um atendente humano?' 
];

function createButtonLoader() {
  const loader = document.createElement('span');
  loader.className = 'loader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-hidden', 'true');
  return loader;
}

function handleAsyncAction(button, action) {
  return async (...args) => {
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '';
    button.append(createButtonLoader(), document.createTextNode('Processando...'));
    try {
      return await action(...args);
    } finally {
      button.disabled = false;
      button.innerHTML = originalContent;
    }
  };
}

export function initToasts() {
  const container = document.getElementById('toastContainer');
  function show(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Fechar';
    close.addEventListener('click', () => container.removeChild(toast));
    toast.appendChild(close);
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.isConnected && container.removeChild(toast), 300);
    }, 3000);
  }

  return {
    success: (message) => show('success', message),
    error: (message) => show('error', message)
  };
}

export function renderDadosView(state, { onLogin, onSave }) {
  const section = document.createElement('section');
  section.className = 'px-6 py-8 max-w-4xl mx-auto w-full flex flex-col gap-6';

  if (!state.session?.user) {
    const card = document.createElement('div');
    card.className = 'card flex flex-col gap-4';
    card.innerHTML = `
      <div>
        <h2 class="text-xl section-title">Entrar no OMR Studio</h2>
        <p class="text-sm text-muted">Use seu e-mail e senha do Supabase Auth.</p>
      </div>
      <form class="form-grid" id="loginForm">
        <label class="text-sm font-medium text-muted">
          E-mail
          <input type="email" name="email" required placeholder="você@empresa.com" autocomplete="email" />
        </label>
        <label class="text-sm font-medium text-muted">
          Senha
          <input type="password" name="password" required placeholder="••••••••" autocomplete="current-password" />
        </label>
        <button type="submit" class="btn-primary w-full">Entrar</button>
      </form>
    `;

    const form = card.querySelector('#loginForm');
    const submitButton = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      await handleAsyncAction(submitButton, () => onLogin(data))();
    });
    section.appendChild(card);
    return section;
  }

  const empresa = state.empresa ?? {
    nome: '',
    tipo: '',
    horario_funcionamento: '',
    contatos_extras: '',
    endereco: '',
    observacoes: '',
    persona: 'josi'
  };

  const produtos = state.produtos?.length ? state.produtos : [];
  const faqs = state.faqs?.length ? state.faqs : [];

  const formCard = document.createElement('div');
  formCard.className = 'card';
  formCard.innerHTML = `
    <div class="flex flex-col gap-1 mb-6">
      <h2 class="text-xl section-title">Dados do negócio</h2>
      <p class="text-sm text-muted">Configure como o agente deve se comportar.</p>
    </div>
    <form id="empresaForm" class="form-grid">
      <div class="form-grid two-columns">
        <label class="text-sm font-medium text-muted">
          Nome da empresa *
          <input name="empresa_nome" required value="${empresa.nome ?? ''}" placeholder="Minha Empresa" />
        </label>
        <label class="text-sm font-medium text-muted">
          Tipo de negócio
          <input name="empresa_tipo" value="${empresa.tipo ?? ''}" placeholder="Ex: Cafeteria" />
        </label>
      </div>
      <div class="form-grid two-columns">
        <label class="text-sm font-medium text-muted">
          Horário de funcionamento
          <input name="horario_funcionamento" value="${empresa.horario_funcionamento ?? ''}" placeholder="Seg-Sex 09:00 - 18:00" />
        </label>
        <label class="text-sm font-medium text-muted">
          Contatos extras
          <input name="contatos_extras" value="${empresa.contatos_extras ?? ''}" placeholder="@instagram (11) 99999-9999" />
        </label>
      </div>
      <label class="text-sm font-medium text-muted">
        Endereço
        <input name="endereco" value="${empresa.endereco ?? ''}" placeholder="Rua das Flores, 123 - Centro" />
      </label>
      <label class="text-sm font-medium text-muted">
        Observações para o agente
        <textarea name="observacoes" rows="3" placeholder="Fale da promoção do dia">${empresa.observacoes ?? ''}</textarea>
      </label>
      <label class="text-sm font-medium text-muted">
        Persona do agente
        <select name="persona">
          <option value="josi" ${empresa.persona === 'josi' ? 'selected' : ''}>Josi (descontraída)</option>
          <option value="clara" ${empresa.persona === 'clara' ? 'selected' : ''}>Clara (objetiva)</option>
        </select>
      </label>
      <div class="section-divider"></div>
      <div class="form-grid" id="produtosSection">
        <div class="flex items-center justify-between">
          <h3 class="font-medium">Produtos</h3>
          <button type="button" class="btn-tertiary" id="addProduto">Adicionar produto</button>
        </div>
        <div class="form-grid" data-collection="produtos"></div>
      </div>
      <div class="section-divider"></div>
      <div class="form-grid" id="faqsSection">
        <div class="flex items-center justify-between">
          <h3 class="font-medium">FAQs</h3>
          <button type="button" class="btn-tertiary" id="addFaq">Adicionar FAQ</button>
        </div>
        <div class="form-grid" data-collection="faqs"></div>
      </div>
      <button type="submit" class="btn-primary self-start">Salvar configurações</button>
    </form>
  `;

  const produtosList = formCard.querySelector('[data-collection="produtos"]');
  const faqsList = formCard.querySelector('[data-collection="faqs"]');

  const addProdutoRow = (produto = {}) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-grid two-columns';
    wrapper.innerHTML = `
      <label class="text-sm font-medium text-muted">
        Nome *
        <input name="produto_nome" required value="${produto.nome ?? ''}" placeholder="Café Latte" />
      </label>
      <label class="text-sm font-medium text-muted">
        Preço
        <input name="produto_preco" value="${produto.preco ?? ''}" placeholder="12,90" />
      </label>
      <label class="text-sm font-medium text-muted col-span-2">
        Descrição
        <input name="produto_descricao" value="${produto.descricao ?? ''}" placeholder="Descrição curta" />
      </label>
      <button type="button" class="btn-tertiary col-span-2 remove">Remover</button>
    `;
    wrapper.querySelector('.remove').addEventListener('click', () => wrapper.remove());
    produtosList.appendChild(wrapper);
  };

  const addFaqRow = (faq = {}) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-grid';
    wrapper.innerHTML = `
      <label class="text-sm font-medium text-muted">
        Pergunta *
        <input name="faq_pergunta" required value="${faq.pergunta ?? ''}" placeholder="Tem delivery?" />
      </label>
      <label class="text-sm font-medium text-muted">
        Resposta *
        <textarea name="faq_resposta" rows="2" required placeholder="Sim, via iFood">${faq.resposta ?? ''}</textarea>
      </label>
      <button type="button" class="btn-tertiary remove self-start">Remover</button>
    `;
    wrapper.querySelector('.remove').addEventListener('click', () => wrapper.remove());
    faqsList.appendChild(wrapper);
  };

  produtos.forEach(addProdutoRow);
  faqs.forEach(addFaqRow);

  formCard.querySelector('#addProduto').addEventListener('click', () => addProdutoRow());
  formCard.querySelector('#addFaq').addEventListener('click', () => addFaqRow());

  const form = formCard.querySelector('#empresaForm');
  const submitButton = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const empresaPayload = {
      nome: formData.get('empresa_nome'),
      tipo: formData.get('empresa_tipo') ?? '',
      horario_funcionamento: formData.get('horario_funcionamento') ?? '',
      contatos_extras: formData.get('contatos_extras') ?? '',
      endereco: formData.get('endereco') ?? '',
      observacoes: formData.get('observacoes') ?? '',
      persona: formData.get('persona') ?? 'josi'
    };

    const produtosPayload = Array.from(produtosList.children).map((row) => {
      const inputs = row.querySelectorAll('input');
      return {
        nome: inputs[0].value,
        preco: inputs[1].value,
        descricao: row.querySelector('input[name="produto_descricao"]').value
      };
    }).filter((item) => item.nome?.trim());

    const faqsPayload = Array.from(faqsList.children).map((row) => {
      return {
        pergunta: row.querySelector('input[name="faq_pergunta"]').value,
        resposta: row.querySelector('textarea[name="faq_resposta"]').value
      };
    }).filter((item) => item.pergunta?.trim() && item.resposta?.trim());

    await handleAsyncAction(submitButton, () => onSave({ empresa: empresaPayload, produtos: produtosPayload, faqs: faqsPayload }))();
  });

  section.appendChild(formCard);
  return section;
}

export function renderTestDriveView(state, { onSend, onChangePersona }) {
  const section = document.createElement('section');
  section.className = 'px-6 py-8 max-w-5xl mx-auto w-full flex flex-col gap-6';

  const card = document.createElement('div');
  card.className = 'card chat-panel';
  card.innerHTML = `
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-xl section-title">Simulador em tempo real</h2>
        <p class="text-sm text-muted">Converse como se fosse o WhatsApp.</p>
      </div>
      <label class="text-sm font-medium text-muted flex items-center gap-2">
        Persona
        <select id="personaSelect">
          <option value="josi" ${state.testDrive.persona === 'josi' ? 'selected' : ''}>Josi</option>
          <option value="clara" ${state.testDrive.persona === 'clara' ? 'selected' : ''}>Clara</option>
        </select>
      </label>
    </div>
    <div class="chat-history" id="simHistory"></div>
    <div class="tag-list" id="suggestions"></div>
    <form id="simForm" class="flex items-center gap-3">
      <input class="flex-1" name="message" required placeholder="Digite sua mensagem" autocomplete="off" />
      <button type="submit" class="btn-primary">Enviar</button>
    </form>
  `;

  const personaSelect = card.querySelector('#personaSelect');
  personaSelect.addEventListener('change', (event) => onChangePersona(event.target.value));

  const historyContainer = card.querySelector('#simHistory');
  const renderHistory = () => {
    historyContainer.innerHTML = '';
    state.testDrive.history.forEach((entry) => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${entry.role}`;
      bubble.textContent = entry.content;
      historyContainer.appendChild(bubble);
    });
    historyContainer.scrollTop = historyContainer.scrollHeight;
  };
  renderHistory();

  const suggestionsContainer = card.querySelector('#suggestions');
  suggestions.forEach((text) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.addEventListener('click', () => {
      simForm.message.value = text;
      simForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    suggestionsContainer.appendChild(button);
  });

  const simForm = card.querySelector('#simForm');
  const submitButton = simForm.querySelector('button[type="submit"]');
  simForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = simForm.message.value.trim();
    if (!message) return;
    simForm.reset();
    await handleAsyncAction(submitButton, () => onSend(message))();
    renderHistory();
  });

  section.appendChild(card);
  return section;
}

export function renderConexoesView(state, { onRefresh, onDisconnect, onSaveSettings }) {
  const section = document.createElement('section');
  section.className = 'px-6 py-8 max-w-5xl mx-auto w-full flex flex-col gap-6';

  const card = document.createElement('div');
  card.className = 'card flex flex-col gap-6';
  const instance = state.instancia ?? null;

  const status = instance?.status ?? 'desconectado';
  const statusBadge = document.createElement('span');
  statusBadge.className = `badge ${status === 'conectado' ? 'success' : status === 'erro' ? 'error' : ''}`;
  statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);

  const header = document.createElement('div');
  header.className = 'flex flex-wrap gap-4 justify-between items-center';
  header.innerHTML = `
    <div>
      <h2 class="text-xl section-title">Conexão Evolution API</h2>
      <p class="text-sm text-muted">Escaneie o QR Code para conectar seu WhatsApp.</p>
    </div>
  `;
  header.appendChild(statusBadge);
  card.appendChild(header);

  if (instance?.qr_svg) {
    const qrContainer = document.createElement('div');
    qrContainer.className = 'border border-border rounded-xl p-4 bg-surface';
    qrContainer.innerHTML = instance.qr_svg;
    card.appendChild(qrContainer);
  }

  const controls = document.createElement('div');
  controls.className = 'form-grid';
  const settings = instance?.settings ?? {
    rejeitar_chamadas: false,
    ignorar_grupos: false,
    sempre_online: true,
    ler_mensagens: true,
    sincronizar_historico: false,
    mensagem_rejeicao: ''
  };

  const toggles = [
    { key: 'rejeitar_chamadas', label: 'Rejeitar chamadas' },
    { key: 'ignorar_grupos', label: 'Ignorar grupos' },
    { key: 'sempre_online', label: 'Sempre online' },
    { key: 'ler_mensagens', label: 'Confirmar leitura' },
    { key: 'sincronizar_historico', label: 'Sincronizar histórico' }
  ];

  const toggleGroup = document.createElement('div');
  toggleGroup.className = 'form-grid two-columns';
  toggles.forEach((toggle) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'toggle';
    wrapper.innerHTML = `
      ${toggle.label}
      <input type="checkbox" name="${toggle.key}" ${settings[toggle.key] ? 'checked' : ''} />
    `;
    toggleGroup.appendChild(wrapper);
  });
  controls.appendChild(toggleGroup);

  const rejectionField = document.createElement('label');
  rejectionField.className = 'text-sm font-medium text-muted';
  rejectionField.innerHTML = `
    Mensagem para chamadas rejeitadas
    <textarea name="mensagem_rejeicao" rows="2" placeholder="No momento não aceitamos chamadas.">${settings.mensagem_rejeicao ?? ''}</textarea>
  `;
  controls.appendChild(rejectionField);

  card.appendChild(controls);

  const buttonsRow = document.createElement('div');
  buttonsRow.className = 'flex flex-wrap gap-3';

  const refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.className = 'btn-secondary';
  refreshButton.textContent = 'Atualizar conexão';
  refreshButton.addEventListener('click', handleAsyncAction(refreshButton, onRefresh));

  const disconnectButton = document.createElement('button');
  disconnectButton.type = 'button';
  disconnectButton.className = 'btn-tertiary';
  disconnectButton.textContent = 'Desconectar';
  disconnectButton.addEventListener('click', handleAsyncAction(disconnectButton, onDisconnect));

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 'btn-primary';
  saveButton.textContent = 'Salvar configurações de instância';
  saveButton.addEventListener('click', () => {
    const payload = toggles.reduce((acc, toggle, index) => {
      const input = toggleGroup.querySelectorAll('input')[index];
      acc[toggle.key] = input.checked;
      return acc;
    }, {});
    payload.mensagem_rejeicao = rejectionField.querySelector('textarea').value;
    return handleAsyncAction(saveButton, () => onSaveSettings(payload))();
  });

  buttonsRow.append(refreshButton, disconnectButton, saveButton);
  card.appendChild(buttonsRow);

  if (state.instanciaLog?.length) {
    const logContainer = document.createElement('div');
    logContainer.className = 'mini-log';
    state.instanciaLog.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'mini-log-entry';
      item.textContent = `[${entry.time}] ${entry.message}`;
      logContainer.appendChild(item);
    });
    card.appendChild(logContainer);
  }

  section.appendChild(card);
  return section;
}

export function renderAjudaView(state, { onSend }) {
  const section = document.createElement('section');
  section.className = 'px-6 py-8 max-w-4xl mx-auto w-full flex flex-col gap-6';

  const card = document.createElement('div');
  card.className = 'card chat-panel';
  card.innerHTML = `
    <div>
      <h2 class="text-xl section-title">Suporte OMR</h2>
      <p class="text-sm text-muted">Tire dúvidas rápidas e receba instruções de escalonamento.</p>
    </div>
    <div class="chat-history" id="supportHistory"></div>
    <form id="supportForm" class="flex items-center gap-3">
      <input class="flex-1" name="message" required placeholder="Descreva sua dúvida" autocomplete="off" />
      <button type="submit" class="btn-primary">Enviar</button>
    </form>
  `;

  const historyContainer = card.querySelector('#supportHistory');
  const renderHistory = () => {
    historyContainer.innerHTML = '';
    state.support.history.forEach((entry) => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${entry.role}`;
      bubble.textContent = entry.content;
      historyContainer.appendChild(bubble);
      if (entry.escalate) {
        const escalate = document.createElement('div');
        escalate.className = 'mini-log-entry';
        escalate.textContent = `Escalar para ${entry.escalate.type}: ${entry.escalate.target}`;
        historyContainer.appendChild(escalate);
      }
    });
    historyContainer.scrollTop = historyContainer.scrollHeight;
  };
  renderHistory();

  const form = card.querySelector('#supportForm');
  const submitButton = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.message.value.trim();
    if (!message) return;
    form.reset();
    await handleAsyncAction(submitButton, () => onSend(message))();
    renderHistory();
  });

  section.appendChild(card);
  return section;
}

export async function requestBusinessData() {
  const { empresa, produtos, faqs } = await api.post('dados.get', {});
  return { empresa, produtos, faqs };
}

export async function saveBusinessData(payload) {
  return api.post('dados.save', payload);
}

export async function simulateChat({ persona, message }) {
  return api.post('sim.chat', { persona, message });
}

export async function fetchInstanceStatus() {
  return api.post('inst.status', {});
}

export async function refreshInstance() {
  return api.post('inst.refresh', {});
}

export async function disconnectInstance() {
  return api.post('inst.disconnect', {});
}

export async function saveInstanceSettings(payload) {
  return api.post('inst.update', payload);
}

export async function sendSupportMessage(message) {
  return api.post('support.chat', { message });
}

export const onboarding = {
  steps: onboardingSteps,
  total: onboardingSteps.length
};

export const fixedSuggestions = suggestions;
