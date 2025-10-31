import { api, logEvent } from './api.js';

function inputValue(value) {
  return value ?? '';
}

const templates = {
  dados(state) {
    const empresa = state.dados_cache.empresa || {};
    return {
      template: `
        <section class="card">
          <h2>Dados da Empresa</h2>
          <form id="empresa-form">
            <label>Nome da empresa</label>
            <input name="nome" required value="${inputValue(empresa.nome)}" placeholder="OMR Studio" />
            <label>Descrição</label>
            <textarea name="descricao" placeholder="Descrição curta">${inputValue(empresa.descricao)}</textarea>
            <label>Horário de funcionamento</label>
            <input name="horario_funcionamento" value="${inputValue(empresa.horario_funcionamento)}" placeholder="Seg-Sex 08h às 18h" />
            <div class="grid-two">
              <div>
                <label>WhatsApp comercial</label>
                <input name="whatsapp" value="${inputValue(empresa.whatsapp)}" placeholder="+55 11 99999-9999" />
              </div>
              <div>
                <label>Website</label>
                <input name="website" type="url" value="${inputValue(empresa.website)}" placeholder="https://omelhorrobo.site" />
              </div>
            </div>
            <button class="primary" type="submit" id="empresa-submit">Salvar dados</button>
          </form>
        </section>
        <section class="card">
          <h2>Produtos principais</h2>
          <p class="muted">Cadastre até 5 ofertas para treinar a IA.</p>
          <div id="produtos-list"></div>
          <button class="ghost" id="novo-produto">Adicionar produto</button>
        </section>
        <section class="card">
          <h2>FAQs</h2>
          <p class="muted">Perguntas frequentes usadas pelo Prompt Builder.</p>
          <div id="faqs-list"></div>
          <button class="ghost" id="nova-faq">Adicionar FAQ</button>
        </section>
      `,
      afterRender: bindDadosView,
    };
  },
  simulador(state) {
    const lastResponse = state.dados_cache.simulador || null;
    const persona = state.dados_cache.persona;
    return {
      template: `
        <section class="card">
          <h2>Test-Drive IA</h2>
          <p class="muted">Envie uma mensagem e veja a persona responder.</p>
          <form id="simulador-form">
            <label>Mensagem</label>
            <textarea name="mensagem" required placeholder="Olá! Quero saber mais sobre..." ></textarea>
            <button class="primary" type="submit" id="simulador-submit">Enviar</button>
          </form>
          ${lastResponse ? `<div class="card" style="margin-top:1rem;">
              <h3>Resposta</h3>
              <p>${lastResponse.mensagem}</p>
            </div>` : ''}
        </section>
        ${persona ? `<section class="card">
          <h2>Persona ativa</h2>
          <p><strong>${persona.nome}</strong> • ${persona.estilo}</p>
          <p>${persona.descricao}</p>
        </section>` : ''}
      `,
      afterRender: bindSimuladorView,
    };
  },
  conexoes(state) {
    const inst = state.dados_cache.instancia || {};
    const status = inst.status || localStorage.getItem('inst_status') || 'desconectado';
    return {
      template: `
        <section class="card">
          <h2>WhatsApp Evolution</h2>
          <div class="status-pill">Status: ${status}</div>
          <p class="muted">Conecte sua instância para ativar o envio de mensagens.</p>
          <div id="qr-area" class="qr-area"></div>
          <button class="primary" id="gerar-qr">Gerar novo QR</button>
        </section>
        <section class="card">
          <h2>APIs e Webhooks</h2>
          <div class="grid-two">
            <div>
              <label>Webhook unificado</label>
              <input readonly value="${location.origin}/webhook/api-backend" />
            </div>
            <div>
              <label>Endpoint público</label>
              <input readonly value="${location.origin}/api" />
            </div>
          </div>
        </section>
      `,
      afterRender: bindConexoesView,
    };
  },
  ajuda() {
    return {
      template: `
        <section class="card">
          <h2>Central de Ajuda</h2>
          <ul>
            <li>📘 <strong>Documentação:</strong> docs.omelhorrobo.site</li>
            <li>🛠️ <strong>Suporte técnico:</strong> suporte@omelhorrobo.site</li>
            <li>📨 <strong>WhatsApp:</strong> +55 11 90000-0000</li>
          </ul>
        </section>
        <section class="card">
          <h2>Checklist</h2>
          <ol>
            <li>Confirme login ativo.</li>
            <li>Salve dados essenciais da empresa.</li>
            <li>Cadastre produtos e FAQs atualizados.</li>
            <li>Teste respostas no simulador.</li>
            <li>Conecte a instância Evolution.</li>
          </ol>
        </section>
      `,
      afterRender: () => {},
    };
  },
};

function bindDadosView(state) {
  const form = document.querySelector('#empresa-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = document.querySelector('#empresa-submit');
    submit.disabled = true;
    const payload = Object.fromEntries(new FormData(form));
    try {
      const response = await api.post('dados/save', {
        action: 'dados.save',
        auth: window.state.user,
        payload,
      });
      window.state.dados_cache.empresa = response.data;
      showToast('Dados salvos com sucesso');
      logEvent('dados.save', payload);
    } catch (error) {
      showToast(error.message || 'Erro ao salvar');
    } finally {
      submit.disabled = false;
    }
  });

  const produtosList = document.querySelector('#produtos-list');
  const faqsList = document.querySelector('#faqs-list');

  const renderColecao = (container, key, label) => {
    const items = window.state.dados_cache[key] || [];
    container.innerHTML = items
      .map(
        (item, index) => `
          <div class="card">
            <div class="grid-two">
              <div>
                <label>${label} ${index + 1}</label>
                <input data-collection="${key}" data-index="${index}" name="titulo" value="${item.titulo || ''}" />
              </div>
              <div>
                <label>Descrição</label>
                <input data-collection="${key}" data-index="${index}" name="descricao" value="${item.descricao || ''}" />
              </div>
            </div>
            <button class="ghost" data-remove="${key}" data-index="${index}">Remover</button>
          </div>
        `,
      )
      .join('');
  };

  renderColecao(produtosList, 'produtos', 'Produto');
  renderColecao(faqsList, 'faqs', 'FAQ');

  document.querySelector('#novo-produto')?.addEventListener('click', () => {
    window.state.dados_cache.produtos = [...(window.state.dados_cache.produtos || []), { titulo: '', descricao: '' }];
    renderColecao(produtosList, 'produtos', 'Produto');
  });

  document.querySelector('#nova-faq')?.addEventListener('click', () => {
    window.state.dados_cache.faqs = [...(window.state.dados_cache.faqs || []), { titulo: '', descricao: '' }];
    renderColecao(faqsList, 'faqs', 'FAQ');
  });

  document.querySelectorAll('[data-collection]').forEach((input) => {
    input.addEventListener('change', (event) => {
      const target = event.currentTarget;
      const collection = target.dataset.collection;
      const index = Number(target.dataset.index);
      const name = target.getAttribute('name');
      const items = [...(window.state.dados_cache[collection] || [])];
      items[index] = { ...items[index], [name]: target.value };
      window.state.dados_cache[collection] = items;
    });
  });

  document.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const key = event.currentTarget.dataset.remove;
      const index = Number(event.currentTarget.dataset.index);
      const items = [...(window.state.dados_cache[key] || [])];
      items.splice(index, 1);
      window.state.dados_cache[key] = items;
      if (key === 'produtos') {
        renderColecao(produtosList, key, 'Produto');
      } else {
        renderColecao(faqsList, key, 'FAQ');
      }
    });
  });
}

function bindSimuladorView() {
  const form = document.querySelector('#simulador-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = document.querySelector('#simulador-submit');
    submit.disabled = true;
    const payload = Object.fromEntries(new FormData(form));
    try {
      const response = await api.post('chat/simular', {
        action: 'chat.simular',
        auth: window.state.user,
        payload,
      });
      window.state.dados_cache.simulador = response.data;
      showToast('Resposta recebida');
      logEvent('chat.simular', payload);
      window.dispatchEvent(new CustomEvent('state:update'));
    } catch (error) {
      showToast(error.message || 'Erro ao enviar mensagem');
    } finally {
      submit.disabled = false;
    }
  });
}

function bindConexoesView() {
  const button = document.querySelector('#gerar-qr');
  const area = document.querySelector('#qr-area');
  button?.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const response = await api.post('instancia/qr', {
        action: 'instancia.qr',
        auth: window.state.user,
      });
      area.innerHTML = `<img src="${response.data.qr}" alt="QR Code" style="width:100%;max-width:320px;border-radius:16px;" />`;
      localStorage.setItem('inst_status', 'aguardando_scan');
      logEvent('instancia.qr', {});
    } catch (error) {
      showToast(error.message || 'Erro ao gerar QR');
    } finally {
      button.disabled = false;
    }
  });
}

export function renderTab(state, tab) {
  const renderer = templates[tab] || templates.dados;
  const { template, afterRender } = renderer(state);
  const view = document.getElementById('view');
  view.innerHTML = template;
  afterRender(state);
}

export const tabOrder = ['dados', 'simulador', 'conexoes', 'ajuda'];

export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = `toast show ${type}`;
  toast.textContent = message;
  setTimeout(() => {
    toast.className = 'toast';
  }, type === 'error' ? 5000 : 3000);
}

window.showToast = showToast;
