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


## Integração Evolution API

- Consulte `docs/integration/evolution-api-setup.md` para configuração detalhada da instância Evolution, webhooks n8n e Supabase.
- As definições de tabelas e funções SQL estão em `supabase/schema.sql`.
- Workflows do n8n podem ser importados a partir dos arquivos `n8n/*.workflow.json`.
- O servidor Express (`src/server.js`) expõe o endpoint `GET /status` que o frontend utiliza para renderizar o painel de conexão.

### Executar servidor de status

```bash
cp .env.example .env # preencha as variáveis
npm install
npm run dev
```

O endpoint `GET /status` retorna:

```json
{
  "data": [
    {
      "instance": "cliente-pizzaria",
      "status": "CONNECTED",
      "lastCheckedAt": "2024-03-04T12:00:00.000Z",
      "lastConnectedAt": "2024-03-04T11:50:00.000Z",
      "attemptingReconnect": false,
      "metadata": { "raw": { /* payload Evolution */ } }
    }
  ]
}
```

O frontend pode mapear `status` para os cards "Desconectado", "Conectando" e "Conectado".
