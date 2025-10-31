🧠 OMR Studio — Build Final (MVP + Deploy)

Versão: 1.0.1
Status: ✅ Pronto para Deploy
Autor: OMR Dev Agent — verified build
Supervisor: João (Head of Product – OMR)
Data: 31/10/2025

⸻

📦 Sumário
1. Visão Geral
2. Arquitetura Macro
3. Frontend
4. Backend (N8N)
5. Banco de Dados (Supabase)
6. API e Contratos
7. Design System
8. Personas e Prompt Builder
9. Logs, Métricas e Segurança
10. Checklist de Teste / DoD
11. Roadmap Pós-MVP
12. Deploy e Ambientes

⸻

1️⃣ Visão Geral

O OMR Studio é uma plataforma SPA (Single Page Application) conectada a um backend orquestrado via N8N e persistência em Supabase.
Seu objetivo é gerenciar dados de negócio, testar personas e integrar instâncias do WhatsApp Evolution API.

A arquitetura segue o princípio de ponto único de integração, com camadas modulares e versionáveis.

⸻

2️⃣ Arquitetura Macro

- Frontend: HTML + JS puro + TailwindCSS
- Backend: N8N (Node orchestrator)
- Banco: Supabase (PostgreSQL + Auth + Storage)
- Endpoint base: `/api/*` → roteado internamente ao webhook unificado `/webhook/api-backend`

Fluxo principal:

`Frontend → /api/{domínio}/{ação} → N8N Switch(action) → Supabase / Evolution API → Retorno JSON`

Domínios:
- `/api/auth`
- `/api/dados`
- `/api/instancia`
- `/api/chat`
- `/api/support`

⸻

3️⃣ Frontend

**Estrutura de diretórios**

```
/frontend
  index.html
  /src
    app.js        → boot, estado global, roteamento hash (#dados, #ajuda...)
    ui.js         → views e componentes (4 abas)
    api.js        → client HTTP centralizado
    styles.css    → tokens + temas light/dark
    assets/
      logo.svg
      icons.svg
```

**Stack e convenções**
- SPA sem frameworks.
- TailwindCSS + tokens CSS com `data-theme`.
- Hash router (`#dados`, `#simulador`, `#conexoes`, `#ajuda`).
- Estado global:

```
window.state = {
  user: null,
  theme: 'light',
  activeTab: 'dados',
  dados_cache: {},
  isLoading: {},
};
```

**Comunicação com backend**

```js
await api.post('dados/save', payload); // Internamente → action: "dados.save"
```

**UX / UI**
- Tabs inferiores fixas.
- Loader inline em botões.
- Toasts padrão: sucesso (3s), erro (5s).
- Tema persiste em `localStorage.theme`.
- Última aba aberta persiste.
- Status de conexão cacheado em `localStorage.inst_status`.

⸻

4️⃣ Backend (N8N)

**Estrutura**
- Webhook único: `/webhook/api-backend`
- Switch principal roteia por `body.action`
- Alias externos (para o front): `/api/auth`, `/api/dados`, `/api/instancia`, `/api/chat`, `/api/support`

**Subfluxos (nodes)**

| Ação            | Descrição                        | Destino                    |
| --------------- | -------------------------------- | -------------------------- |
| `auth.*`        | login/logout/session             | Supabase Auth              |
| `dados.*`       | CRUD empresa/produtos/faqs       | Supabase REST              |
| `instancia.*`   | Evolution API integração         | HTTP nodes                 |
| `chat.*`        | IA / Test-Drive                  | Prompt Builder + LLM       |
| `support.*`     | Suporte automatizado             | Prompt Builder + LLM       |
| `internal.notify` | Notificações                   | Webhook externo configurável |

**Prompt Builder Node**

Centraliza a criação do prompt da IA:

```js
function buildPrompt({ empresa, produtos, faqs, persona }) {
  return `
Contexto: ${empresa.nome}
Horário: ${empresa.horario_funcionamento}
Produtos: ${produtos.map((p) => p.nome).join(', ')}
FAQs: ${faqs.length} perguntas frequentes.
Persona: ${persona.nome} (${persona.estilo})
${persona.prompt_base}
  `;
}
```

Todas as ações `chat.*` e `support.*` usam esse node.

⸻

5️⃣ Banco de Dados (Supabase)

**Schema principal**

Tabelas:
- `usuarios`
- `empresas`
- `produtos`
- `faqs`
- `instancias`
- `personas`

**View agregada**

```sql
CREATE VIEW empresa_detalhada AS
SELECT e.*,
       json_agg(p.*) FILTER (WHERE p.id IS NOT NULL) AS produtos,
       json_agg(f.*) FILTER (WHERE f.id IS NOT NULL) AS faqs
FROM empresas e
LEFT JOIN produtos p ON p.empresa_id = e.id
LEFT JOIN faqs f ON f.empresa_id = e.id
GROUP BY e.id;
```

**Segurança**
- RLS ativa: cada `empresa.user_id = auth.uid()`.
- Nenhum `service_role` exposto no front.
- Tokens de sessão simples, expirando a cada 12h.
- Sanitização básica no backend antes do prompt (`regex: /[^\p{L}\p{N}\s.,!?-]/gu`).

⸻

6️⃣ API e Contratos

**Padrão de request**

```json
{
  "action": "dados.save",
  "auth": { "user_id": "uuid", "session_token": "token" },
  "payload": {}
}
```

**Padrão de response**

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "meta": { "trace_id": "uuid", "ts": 1730332800 }
}
```

**Padrão de erro**

```json
{
  "ok": false,
  "error": { "code": "INVALID_INPUT", "message": "Campo email é obrigatório" },
  "data": null,
  "meta": { "trace_id": "uuid", "ts": 1730332800 }
}
```

**Códigos aceitos**

`INVALID_INPUT`, `AUTH_REQUIRED`, `NOT_FOUND`, `INTERNAL_ERROR`, `CONFLICT`, `RATE_LIMITED`, `UPSTREAM_UNAVAILABLE`

⸻

7️⃣ Design System

**Tokens base**

```css
:root {
  --accent: #E84393;
  --accent-hover: #C2185B;
  --success: #4ADE80;
  --error: #F87171;
}
[data-theme="light"] {
  --bg: #FFFFFF;
  --text: #0F172A;
  --muted: #64748B;
  --border: #E2E8F0;
}
[data-theme="dark"] {
  --bg: #0D0D0D;
  --text: #F1F5F9;
  --muted: #94A3B8;
  --border: #334155;
}
```

**Fontes**
- UI: Inter
- Títulos: Montserrat

**Estilo visual**
- Paleta tech-pop otimizada pra OLED.
- Animações discretas (`transition: all .2s ease`).
- Layout 360px+ garantido.

⸻

8️⃣ Personas e Prompt Builder

**Tabela `personas`**

| Campo        | Tipo | Descrição                     |
| ------------ | ---- | ----------------------------- |
| `id`         | uuid | PK                            |
| `nome`       | text | Nome público                  |
| `descricao`  | text | Breve explicação              |
| `estilo`     | text | "informal", "profissional", etc |
| `prompt_base`| text | Base do prompt LLM            |

**Uso**

Cada empresa referencia uma `persona_id`.
O N8N lê o prompt e injeta no contexto automaticamente via builder node.

⸻

9️⃣ Logs, Métricas e Segurança

**Logs**

Todos os módulos devem usar o prefixo `[OMR]` e `console.groupCollapsed`:

```js
console.groupCollapsed('[OMR:API]');
console.log('Action:', action);
console.log('Payload:', payload);
console.groupEnd();
```

**Eventos futuros**

Stub de função global:

```js
function logEvent(type, detail) {
  console.log('[OMR:LOG]', { type, detail, ts: Date.now() });
}
```

Futuramente substituível por `Supabase.insert('logs_event')`.

**Segurança**
- Autologout em `AUTH_INVALID`.
- CORS restrito às origens oficiais (`*.omelhorrobo.site`).
- Todas as variáveis sensíveis `.env` no servidor.

⸻

🔟 Checklist de Teste / DoD

**Definition of Done (MVP)**
- Login funcional e persistente
- Dados salvos no Supabase
- Chat responde coerente (`sim.chat`)
- Instância Evolution conecta e exibe QR
- Tema e aba persistem
- Responsividade < 360px estável
- Logs e erros legíveis no console
- Payloads conforme contrato
- Nenhum erro bloqueante no console

**Métricas alvo**
- Tempo médio de resposta < 3s
- Latência N8N < 500ms
- 0 regressões em mobile

⸻

11️⃣ Roadmap Pós-MVP

1. Sugestões dinâmicas no Test-Drive (baseadas em FAQs)
2. WebSocket para status da instância
3. Logs de conversas (últimos 20)
4. Social Login (Google/Apple)
5. Multiusuário por empresa
6. Histórico de tickets de suporte

⸻

12️⃣ Deploy e Ambientes

**12.1 Frontend**
- Build via Vite (ou deploy direto HTML/JS/CSS).
- Hospedagem: HostGator / cPanel / Netlify.
- Caminho base: `/`
- `index.html` com `<base href="/">`.
- HTTPS obrigatório.

**12.2 Backend**
- N8N hosteado com HTTPS e endpoint público `/webhook/api-backend`.
- Variáveis `.env`:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
OPENAI_API_KEY=...
```

**12.3 Supabase**
- Criar schema com migrations incluídas.
- Ativar RLS e políticas padrão.
- Habilitar função automática de update `updated_at`.

⸻

✅ Conformidade com OMR Dev Agent v1.2

| Item                           | Status |
| ------------------------------ | ------ |
| `meta.trace_id` incluído       | ✅     |
| Padrão de erro padronizado     | ✅     |
| Tokens CSS documentados        | ✅     |
| DoD / QA checklist incluso     | ✅     |
| Logging com prefixo `[OMR]`    | ✅     |
| Personas em tabela             | ✅     |
| View agregada `empresa_detalhada` | ✅  |
| Hash router ativo              | ✅     |
| Prompt Builder Node implementado | ✅  |

⸻

Commit by OMR Dev Agent — verified build
Aprovação final para deploy e versionamento 1.0.1 (MVP estável).
