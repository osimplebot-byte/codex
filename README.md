# Supabase Control Center

Aplicação React + Vite + TypeScript com Tailwind CSS para centralizar autenticação, CRUD, automações (n8n/Edge Functions) e deploy automatizado para HostGator.

## 🧱 Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) com TypeScript
- [Tailwind CSS 3](https://tailwindcss.com/) para o design system
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript) para autenticação e CRUD
- Integração REST para webhooks/flows (n8n ou Supabase Edge Functions)
- GitHub Actions com deploy via FTP para o diretório `public_html`

## 🚀 Início rápido

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## 🔐 Variáveis de ambiente

Crie um arquivo `.env` na raiz e informe as credenciais:

```bash
VITE_SUPABASE_URL=https://<id>.supabase.co
VITE_SUPABASE_ANON_KEY=<chave-anon>
VITE_API_BASE_URL=https://api.seudominio.com/webhooks
```

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` habilitam login, logout, cadastro e CRUD na tabela `records`.
- `VITE_API_BASE_URL` aponta para os endpoints REST usados nas abas **Simulador**, **Conexão** e **Ajuda** (`/simulate`, `/connection/status`, `/connection/sync`, `/help/articles`). Caso não seja definido, mensagens de aviso são exibidas na interface.

## 📄 Tabela de exemplo (Supabase)

A aba **Dados** utiliza a tabela `records` (ajuste conforme sua necessidade). Exemplo mínimo:

```sql
create table if not exists public.records (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  value numeric not null,
  created_at timestamptz default now()
);

alter table public.records enable row level security;
create policy "Allow authenticated CRUD" on public.records
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
```

## 🔁 Endpoints REST esperados

| Aba | Método | Rota relativa | Observação |
| --- | ------ | ------------- | ---------- |
| Simulador | `POST` | `/simulate` | Recebe `{ amount, rate, term }` e retorna totais/mensalidades. |
| Conexão | `GET` | `/connection/status` | Retorna `{ status, lastSync, details }`. |
| Conexão | `POST` | `/connection/sync` | Dispara sincronização imediata (retorna `{ message }`). |
| Ajuda | `GET` | `/help/articles` | Lista artigos extras para a base de conhecimento. |

Esses endpoints podem ser expostos via n8n, Supabase Edge Functions ou outra API.

## 🧭 Estrutura das páginas

- **/login** – Tela de autenticação com modo login/cadastro usando Supabase Auth.
- **/dashboard** – Layout principal com abas:
  - **Dados**: CRUD completo na tabela `records` (listagem, inclusão e remoção).
  - **Simulador**: formulário financeiro que consome o endpoint `/simulate`.
  - **Conexão**: status em tempo real e gatilho de sincronização (`/connection/status` e `/connection/sync`).
  - **Ajuda**: base de conhecimento misturando conteúdo estático e o retorno de `/help/articles`.

## 🛠️ Scripts úteis

| Comando | Descrição |
| ------- | --------- |
| `npm run dev` | Ambiente de desenvolvimento com Vite. |
| `npm run build` | Compila o bundle de produção (`dist/`). |
| `npm run preview` | Preview do build localmente. |
| `npm run lint` | Executa ESLint. |

## 📦 Deploy automático (HostGator)

O pipeline em `.github/workflows/deploy.yml` executa:

1. `npm ci` + `npm run build` (Node 20).
2. Publica o diretório `dist/` como artefato.
3. Envia os arquivos para o `public_html` via [SamKirkland/FTP-Deploy-Action](https://github.com/SamKirkland/FTP-Deploy-Action).

Configure os segredos do repositório:

- `HOSTGATOR_FTP_HOST`
- `HOSTGATOR_FTP_USER`
- `HOSTGATOR_FTP_PASSWORD`

Opcionalmente ajuste `server-dir` para subpastas dentro de `public_html`.

## ✅ Checklist pós-deploy

- [ ] Criar usuários no Supabase Auth ou habilitar OAuth desejado.
- [ ] Definir políticas RLS compatíveis com a tabela usada.
- [ ] Apontar `VITE_API_BASE_URL` para o fluxo n8n/Edge publicado.
- [ ] Validar build com `npm run build` antes de subir para produção.
- [ ] Rodar o workflow manualmente (`workflow_dispatch`) para testar o deploy.

## 🆘 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação n8n](https://docs.n8n.io/)
- [Tailwind CSS](https://tailwindcss.com/docs)

Fique à vontade para adaptar componentes, adicionar autenticação social ou ampliar os fluxos REST conforme o crescimento do projeto.
