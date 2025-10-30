# Plano de Implementação de Infraestrutura

Este guia descreve como provisionar e integrar Supabase, n8n, Evolution API e o fluxo de deploy contínuo no HostGator. O objetivo é entregar uma base robusta para o robô de atendimento descrito no README.

## 1. Supabase

### 1.1 Provisionar projeto
1. Acesse [https://app.supabase.com](https://app.supabase.com) e crie uma conta ou faça login.
2. Clique em **New project**, informe o nome do projeto e selecione a organização adequada.
3. Escolha uma região próxima aos seus usuários, defina a senha do banco e finalize clicando em **Create new project**.
4. Após a criação, anote o `Project URL`, `anon` e `service_role` keys em **Project Settings → API**; serão usadas pelo n8n e pela Evolution API.

### 1.2 Configurar autenticação
1. Em **Authentication → Providers**, habilite o e-mail/senha e os provedores sociais desejados (Google/Apple). Configure as credenciais OAuth conforme a documentação.
2. Ajuste as opções de e-mail (templates e remetente) em **Authentication → Templates** e **SMTP Settings** se for usar envio próprio.

### 1.3 Banco de dados e storage
1. No painel SQL Editor, rode os scripts para criar tabelas: `profiles`, `business_settings`, `faqs`, `whatsapp_connections` e qualquer outra necessária ao painel.
2. Em **Storage → Buckets**, crie um bucket `public-assets` para armazenar arquivos enviados pelo usuário (ex.: imagens de catálogo). Marque como **public** se necessário.

### 1.4 Habilitar Row Level Security (RLS)
1. Em **Database → Tables**, selecione cada tabela e ative **Enable RLS**.
2. Adicione policies básicas por tabela. Exemplo para `profiles`:
   ```sql
   -- Permite que o usuário veja e atualize apenas o próprio registro
   create policy "Individuals can view their profile"
     on public.profiles
     for select
     using (auth.uid() = id);

   create policy "Individuals can update their profile"
     on public.profiles
     for update
     using (auth.uid() = id)
     with check (auth.uid() = id);
   ```
3. Para tabelas vinculadas ao negócio (ex.: `business_settings`), use a coluna `user_id`:
   ```sql
   create policy "Owner can manage business settings"
     on public.business_settings
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```
4. Para buckets do storage, configure **Policies** em **Storage → Policies**, garantindo que apenas o dono do recurso tenha acesso de leitura/escrita, ou torne-os públicos conforme a necessidade.

## 2. n8n

### 2.1 Instalação
- **Cloud:** Crie uma conta em [https://app.n8n.cloud](https://app.n8n.cloud). Escolha o plano apropriado e gere uma instância.
- **Self-host (Docker):**
  1. Crie um servidor (Ubuntu 22.04+). Instale Docker e Docker Compose.
  2. Crie o arquivo `docker-compose.yml` com imagem oficial `n8nio/n8n`.
  3. Configure variáveis `N8N_HOST`, `N8N_PORT`, `N8N_PROTOCOL=https`, `WEBHOOK_TUNNEL_URL` (se usar tunnel) e um volume persistente.
  4. Rode `docker compose up -d` e acesse `https://seu-dominio` para finalizar o setup.

### 2.2 Credenciais
1. Dentro do n8n, acesse **Credentials**.
2. Crie credencial **Supabase** com `URL`, `API Key` (`service_role` para operações administrativas ou `anon` para consultas limitadas) e configure headers conforme necessário.
3. Crie credencial **OpenAI** com a API key obtida em [https://platform.openai.com](https://platform.openai.com). Configure endpoint e modelo (ex.: `gpt-4.1`) nas workflows.
4. Para a **Evolution API**, crie credencial HTTP genérica com o `base URL`, token (chave de instância) e headers exigidos (`apikey`, `sessionkey` etc.).

### 2.3 Workflows iniciais
1. Crie workflow "WhatsApp Inbound" com trigger **Webhook** (metod `POST`) para receber eventos da Evolution API.
2. Adicione nós para:
   - Buscar contexto no Supabase (`Supabase → Query`)
   - Consultar resposta na OpenAI
   - Registrar logs em tabela `conversation_logs`
   - Enviar resposta para Evolution API via HTTP Request.
3. Publique o workflow e copie a URL do webhook para configurar na Evolution API.

## 3. Evolution API

### 3.1 Instalação e configuração
1. Siga a documentação oficial ([https://evolution-api.com](https://evolution-api.com)). Pode ser SaaS ou self-host (Docker).
2. No `config.json`, defina o `webhookUrl` com a URL do webhook do n8n criado no passo anterior.
3. Configure variáveis de ambiente (tokens, número do WhatsApp Business, etc.).

### 3.2 Criar usuário/instância WhatsApp Business
1. No painel da Evolution API, crie um novo usuário (se necessário) e gere uma instância.
2. Associe o número do WhatsApp Business e escaneie o QR Code pelo aplicativo para autenticar.
3. Anote o `sessionKey` e `apikey`; serão usados nas requisições HTTP do n8n.

### 3.3 Testes
1. Envie uma mensagem de teste pelo WhatsApp.
2. Verifique no painel da Evolution API se o webhook foi disparado.
3. Confirme no n8n que o workflow executou, consultou Supabase e respondeu corretamente.

## 4. Deploy contínuo no HostGator (cPanel)

### 4.1 Habilitar SSH/Git
1. No cPanel, acesse **SSH Access** e gere ou carregue uma chave pública.
2. Ative o acesso e configure `ssh` do seu ambiente local para conectar: `ssh usuario@seu-dominio`.
3. Dentro do cPanel, vá em **Git Version Control** e crie um repositório apontando para o branch de produção (por exemplo, GitHub). Configure o diretório de deploy (ex.: `/home/usuario/public_html/app`).
4. Configure post-receive hooks ou use a função "Deploy HEAD Commit" para puxar as atualizações automaticamente.

### 4.2 Deploy usando File Manager (alternativa)
1. Caso o acesso SSH/Git não seja possível, faça o build estático localmente (ex.: `npm run build`).
2. Compacte os arquivos gerados (por ex., diretório `dist/`).
3. No cPanel, acesse **File Manager**, navegue até `public_html` ou diretório desejado e faça upload do arquivo `.zip`.
4. Use o botão **Extract** para descompactar o build e sobrescrever a versão anterior.
5. Limpe caches (Cloudflare, LiteSpeed) se estiverem habilitados.

### 4.3 Automatização mínima
1. Configure um script de deploy (Git hook ou GitHub Actions) que, após build, faça `rsync` via SSH ou `scp` dos arquivos para o servidor.
2. Opcional: use GitHub Actions com um job que, em push para `main`, roda o build e faz deploy via `scp` usando `secrets` para credenciais.

---

Com esses passos, os serviços estarão integrados: Supabase fornece autenticação/dados, n8n orquestra automações, Evolution API garante o canal WhatsApp, e HostGator entrega o front-end ao usuário final.
