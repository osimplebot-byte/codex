# Deploy OMR Studio

## Frontend
- Hospede o diretório `frontend/` em provedor estático (Netlify, Vercel ou cPanel).
- Configure o build como deploy direto de arquivos estáticos.
- Garanta HTTPS e cabeçalho `Cache-Control: max-age=3600` para assets.
- Ajuste variáveis de ambiente através de arquivo `config.json` se necessário.

## Backend (n8n)
- Importe `backend/n8n/flow.json` no painel do n8n.
- Configure credenciais Supabase, Evolution API e OpenAI.
- Defina variáveis de ambiente:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
  - `OPENAI_API_KEY`
- Exponha o webhook `https://{host}/webhook/api-backend` e crie proxy `/api/*` apontando para ele.

## Supabase
- Execute os scripts em ordem: `schema.sql`, `policies.sql`, `seed.sql`.
- Ative RLS em todas as tabelas (já contemplado nos scripts).
- Configure `Auth -> Providers` apenas com e-mail/senha.
- Cadastre variáveis `JWT secret` iguais às do backend.

## Monitoramento
- Ative logs HTTP no n8n.
- Configure alertas básicos (latência > 500ms) via Slack ou e-mail.
