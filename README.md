# Visão Geral da Plataforma

## O que é a plataforma?
Simplificando, oferecemos um "robô de atendimento" — um agente de IA que qualquer dono de negócio pode configurar sozinho direto do celular. O cliente acessa nosso painel (um site responsivo), preenche formulários sobre a própria empresa (horários, produtos, tom de voz) e nós conectamos essa inteligência ao WhatsApp Business dele.

## Proposta de Valor
> Configure seu atendente virtual de WhatsApp em minutos, direto do seu celular.

## Público-Alvo
- Donos de pequenos negócios.
- Profissionais autônomos, como médicos ou advogados.
- Usuários com pouca paciência para tecnologia complicada e que operam prioritariamente pelo celular.

## Fluxo de telas

### Tela 1: Login / Cadastro
- Porta de entrada para criar a conta ou acessar o painel.
- Autenticação por e-mail e senha.
- Opção de "Esqueci minha senha".
- Login social disponível (Google/Apple) para facilitar o acesso.

### Tela 2: Dashboard
O dashboard é organizado em abas, como se fossem aplicativos diferentes dentro do painel. Logo no primeiro acesso, o usuário encontra um passo a passo guiado que indica em qual aba começar e o que falta configurar.

#### Aba 1: Dados — "O Cérebro da IA"
Área em que o cliente ensina a IA preenchendo formulários com:
- Nome da empresa, descrição e segmento (por exemplo, "Pizzaria").
- Horário de funcionamento (para a IA responder corretamente quando estiver fora do expediente).
- Tom de voz (formal, amigável etc.).
- Lista de produtos ou serviços.
- Perguntas frequentes (FAQs).

> Dica para o suporte: Se o cliente estiver com dificuldade, confirme que ele salvou cada seção. Campos obrigatórios exibem um selo vermelho até serem preenchidos.

#### Aba 2: Simulador — "O Test Drive"
- Chat interno para o cliente testar a IA configurada antes de conectar ao WhatsApp real.
- As mensagens do cliente aparecem à esquerda e as respostas da IA à direita, simulando o WhatsApp.
- Há um botão de "Reiniciar Simulação" caso ele queira limpar o histórico e testar outro cenário.

#### Aba 3: Conexão — "A Tomada"
- Exibe um QR Code para conectar o WhatsApp Business, de forma similar ao WhatsApp Web.
- O painel mostra em tempo real o status da conexão (Desconectado, Conectando, Conectado).
- Um resumo dos passos também é listado: abrir o WhatsApp Business, ir em Dispositivos Conectados e escanear o código.

#### Aba 4: Ajuda — "Fale Conosco"
- Canal de suporte direto dentro do painel.
- A conversa é atendida por uma IA interna especializada em auxiliar o cliente a usar o painel.
- Quando a IA identifica necessidade humana, o chamado é escalonado automaticamente para um atendente.

## Como funciona na prática
1. **Crie a conta** pela tela de Login/Cadastro em menos de um minuto.
2. **Alimente a aba Dados** com as informações essenciais sobre o negócio.
3. **Teste a experiência** com o Simulador e ajuste tom de voz ou respostas conforme necessário.
4. **Conecte o WhatsApp Business** lendo o QR Code na aba Conexão.
5. **Conte com o suporte** a qualquer momento pela aba Ajuda.

## Benefícios principais
- Configuração 100% mobile-friendly, pensada para quem não quer perder tempo com computadores.
- IA treinada com base nas informações do próprio cliente, garantindo atendimento personalizado.
- Suporte contínuo para dúvidas rápidas ou ajustes mais profundos.

## Implementação Técnica

### Frontend (Vanilla JS + Tailwind CDN)
- A pasta [`frontend/`](frontend/) concentra o MVP do painel SPA.
- [`frontend/index.html`](frontend/index.html) carrega Tailwind via CDN, aplica as fontes Inter/Montserrat e contém a estrutura base (header, tabs inferiores, overlay de onboarding).
- Em [`frontend/src/app.js`](frontend/src/app.js) vivem o roteamento por abas, gerenciamento de tema (localStorage), estado global (`window.state`) e integrações com a API unificada (`/webhook/api-backend`).
- [`frontend/src/ui.js`](frontend/src/ui.js) centraliza o render das quatro views, componentes utilitários (toasts, loaders) e clients auxiliares para cada ação (`dados.save`, `sim.chat`, `inst.update`, `support.chat`).
- [`frontend/src/styles.css`](frontend/src/styles.css) declara os tokens do design system (cores claras/escuras, botões, toasts, toggles) e garante responsividade em 360px.
- Assets leves vivem em [`frontend/src/assets/`](frontend/src/assets/) (`logo.svg` e `icons.svg`).

### Estrutura no Supabase
- O schema do MVP está em [`supabase/schema.sql`](supabase/schema.sql), com tabelas enxutas alinhadas ao contrato:
  - `usuarios`: autenticação por e-mail/senha.
  - `empresas`: dados gerais do negócio + persona.
  - `produtos` e `faqs`: listas relacionadas à empresa.
  - `instancias`: informações da integração com a Evolution API.
- Todas as tabelas sensíveis possuem RLS “o que é meu é meu”, validando `auth.uid()` ↔ `user_id`.
- Triggers `moddatetime` mantêm os campos `updated_at` sincronizados automaticamente.

### Serviço utilitário (Node.js)
- [`src/services/contextService.js`](src/services/contextService.js) permanece disponível para cenários que precisem montar prompts compostos, cachear respostas e registrar custo de sessões em Supabase.
- Utilize as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` antes de rodar qualquer script Node.

### Fluxo n8n sugerido
- O blueprint inicial está em [`n8n/workflows/omr-studio-mvp.json`](n8n/workflows/omr-studio-mvp.json):
  - Webhook único `/webhook/api-backend` → Switch por `body.action`.
  - Nós Supabase para `auth.login`, `dados.get` e leituras de instância.
  - Funções placeholders para orquestrar Evolution API / LLM no `sim.chat`.
  - Nó de suporte que pode ser expandido para heurísticas de escalonamento.
- Ajuste credenciais (Supabase Service Role, Evolution API, provedores LLM) no painel do n8n antes de publicar.

