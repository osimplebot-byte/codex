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

### Estrutura no Supabase
- O arquivo [`supabase/schema.sql`](supabase/schema.sql) cria três tabelas chave:
  - `standard_prompts`: guarda o tom de voz, catálogo e FAQs padrão por empresa/idioma.
  - `response_cache`: armazena respostas recorrentes com TTL configurável para acelerar FAQs.
  - `session_usage`: registra tokens, modelo e custo por sessão para controle financeiro.
- O seed [`supabase/seed_prompts.sql`](supabase/seed_prompts.sql) popula uma empresa exemplo com prompts iniciais.

### Serviço utilitário (Node.js)
- [`src/services/contextService.js`](src/services/contextService.js) centraliza operações:
  - Busca prompts ativos no Supabase e monta o contexto completo.
  - Calcula/faz cache de respostas frequentes (hash SHA-256 por pergunta).
  - Disponibiliza função `calculateCost` e `recordSessionUsage` para registrar consumo.
- Depende das variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` para autenticar com o client service-role.

### Fluxo n8n sugerido
- O workflow [`n8n/workflows/whatsapp-assistant.json`](n8n/workflows/whatsapp-assistant.json) exemplifica:
  - Consulta prompts e cache no Supabase logo após receber a mensagem.
  - Monta contexto dinâmico com fallback de catálogo quando vazio.
  - Usa o nó OpenAI (modelo `gpt-4.1-mini`) para gerar respostas quando o cache falhar.
  - Atualiza cache e registra custo/tokens na tabela `session_usage` após cada resposta.
- Ajuste credenciais (`Supabase Service Role`, `OpenAI`) e variáveis (`business_id`, `locale`) conforme sua instância.

