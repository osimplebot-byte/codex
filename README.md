# Visão Geral da Plataforma

## O que é a plataforma?
Simplificando, oferecemos um "robô de atendimento" — um agente de IA que qualquer dono de negócio pode configurar sozinho direto
do celular. O cliente acessa nosso painel (um site responsivo), preenche formulários sobre a própria empresa (horários, produto
s, tom de voz) e nós conectamos essa inteligência ao WhatsApp Business dele.

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
O dashboard é organizado em abas, como se fossem aplicativos diferentes dentro do painel. Logo no primeiro acesso, o usuário enc
ontra um passo a passo guiado que indica em qual aba começar e o que falta configurar.

#### Aba 1: Dados — "O Cérebro da IA"
Área em que o cliente ensina a IA preenchendo formulários com:
- Nome da empresa, descrição e segmento (por exemplo, "Pizzaria").
- Horário de funcionamento (para a IA responder corretamente quando estiver fora do expediente).
- Tom de voz (formal, amigável etc.).
- Lista de produtos ou serviços.
- Perguntas frequentes (FAQs).

> Dica para o suporte: Se o cliente estiver com dificuldade, confirme que ele salvou cada seção. Campos obrigatórios exibem um s
e lo vermelho até serem preenchidos.

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

---

## Workflows de Automação

A pasta `src/workflows` concentra as automações que orquestram a sincronização de dados com o Supabase, consultas ao OpenAI e integrações com canais de atendimento. Todos os workflows recebem dados brutos, validam e retornam respostas prontas para a camada de aplicação.

### 1. Onboarding (`runOnboardingWorkflow`)
Sincroniza os dados do formulário inicial com o Supabase. Recebe o payload completo do formulário, valida com Zod e persiste/atualiza o registro na tabela `customer_profiles`, marcando a data de conclusão do onboarding.

### 2. Simulador (`runSimulatorWorkflow`)
Busca contexto do cliente no Supabase, recupera histórico recente da conversa de simulação e chama o endpoint `chat.completions` da OpenAI para gerar a resposta da IA. O histórico é registrado em `conversation_turns`, mantendo o simulador alinhado com o comportamento futuro do bot real.

### 3. WhatsApp bridge (`runWhatsAppBridgeWorkflow`)
Recebe webhooks da Evolution API, resolve o ID do cliente e o contexto de conversa, consulta o Supabase para carregar perfil e histórico, gera a resposta com OpenAI e envia a mensagem de volta pela Evolution API. Toda a interação é persistida em `conversation_turns` para auditoria.

### 4. Helpdesk (`runHelpdeskWorkflow`)
Opera o chat de suporte opcional. A IA responde em formato JSON já indicando se o chamado deve ser escalado. Quando `escalate = true`, o workflow aciona notificações por e-mail (via SMTP configurado) e WhatsApp interno (via Evolution API), garantindo que um humano entre no atendimento.

## Variáveis de ambiente necessárias

| Variável | Descrição |
| --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Chave de serviço com acesso a leitura/gravação |
| `OPENAI_API_KEY` | Chave de API da OpenAI |
| `EVOLUTION_API_URL` | Endpoint base da Evolution API |
| `EVOLUTION_API_TOKEN` | Token Bearer para chamadas Evolution |
| `HELPDESK_EMAIL_FROM` | Remetente usado nos e-mails de escalação |
| `HELPDESK_EMAIL_TO` | Destinatário principal das notificações de escalação |
| `HELPDESK_SMTP_URL` | URL de conexão SMTP (ex: `smtp://user:pass@smtp.mail.com`) |
| `HELPDESK_ESCALATION_NUMBER` | Número interno que receberá alertas via WhatsApp |

## Como usar

```ts
import { loadEnvironment, runOnboardingWorkflow } from './dist/index.js';

const env = loadEnvironment();

await runOnboardingWorkflow(env, {
  id: 'f0f4a510-8d6f-4a9b-b5c1-9f6c4e957d3c',
  companyName: 'Pizzaria da Esquina',
  products: ['Pizza marguerita', 'Pizza calabresa'],
});
```

Compile com `npm run build` e utilize os workflows diretamente ou acople-os a handlers HTTP (Next.js API Routes, Fastify, etc.).
