# Integração Evolution API + n8n + Supabase

Este guia descreve a configuração completa para conectar o WhatsApp Business do cliente à plataforma por meio da Evolution API, orquestrar mensagens com o n8n e persistir eventos no Supabase.

## 1. Provisionar a instância da Evolution API

1. **Subir container**
   - Recomendado utilizar Docker, conforme documentação oficial (`evolution-api`).
   - Defina variáveis de ambiente essenciais:
     - `SERVER_URL`: URL pública do container.
     - `AUTHENTICATION_HEADER`: token global (ex.: `Bearer <jwt>`).
     - `ADMIN_TOKEN`: reutilizado como `EVOLUTION_API_TOKEN` no n8n.
2. **Criar instância**
   - Realize requisição `POST /instance/create` com payload:

     ```json
     {
       "instanceName": "cliente-<slug>",
       "token": "<token-gerado>",
       "qrcode": true
     }
     ```

   - Armazene os campos `instanceKey` e `token` no Vault/Secrets Manager e replique no Supabase (`integration_settings`).
3. **Associar número WhatsApp**
   - Acesse `GET /instance/cliente-<slug>/qrcode` e escaneie com o WhatsApp Business do cliente.
   - Monitore o evento `CONNECTED` retornado no WebSocket/REST `GET /instance/cliente-<slug>/status`.

## 2. Webhooks para o n8n

### 2.1 Fluxo de mensagens recebidas (`incoming`)

1. Crie workflow HTTP Trigger (`POST /webhook/evolution/incoming`).
2. Configure **Headers** esperados:
   - `x-evolution-instance`: validação contra `instanceKey`.
   - `authorization`: token compartilhado.
3. Normalize payload (vide `n8n/incoming.workflow.json`):

   ```json
   {
     "direction": "inbound",
     "instance": "cliente-<slug>",
     "whatsapp_message_id": "{{ $json["message"]["id"] }}",
     "from": "{{ $json["message"]["from"] }}",
     "to": "{{ $json["message"]["to"] }}",
     "body": "{{ $json["message"]["body"] }}",
     "type": "{{ $json["message"]["type"] }}",
     "timestamp": "{{ $json["message"]["timestamp"] }}",
     "raw_payload": "={{JSON.stringify($json)}}"
   }
   ```
4. Utilize nó **Supabase (Insert)** apontando para tabela `whatsapp_messages`.
5. Finalize com nó **Respond to Webhook** retornando `200`.

### 2.2 Fluxo de mensagens enviadas (`outgoing`)

1. Workflow n8n com **Webhook (POST /webhook/evolution/outgoing)**.
2. Primeiro, recupere as credenciais na tabela `integration_settings` (node Supabase `Get All` filtrando por `instance`).
3. Nó **Supabase (Insert)** registra a mensagem enviada.
4. Nó **HTTP Request** chama `POST /message/sendText/<instance>` na Evolution API (veja `n8n/outgoing.workflow.json`):

   ```json
   {
     "number": "={{$json["to"]}}",
     "text": "={{$json["body"]}}"
   }
   ```
5. Responder com status HTTP conforme retorno da Evolution API.

> O campo `instance` enviado ao webhook deve corresponder ao valor utilizado em `integration_settings.instance`; o node de consulta converte automaticamente para `evolution_instance_key` antes de chamar a Evolution API.

## 3. Reconexão e monitoramento

1. Crie workflow `Evolution - Monitor Status` (ver `/n8n/connection-monitor.json`).
2. Agendamento **Cron** a cada 1 minuto.
3. Passos principais (o workflow `n8n/connection-monitor.workflow.json` já contém essas etapas):
   - Nó **HTTP Request** → `GET /instance/<slug>/status`.
   - Nó **IF** avalia `result.state !== 'CONNECTED'`.
   - Branch "desconectado":
     - Nó **HTTP Request** → `POST /instance/<slug>/restart`.
     - Nó **Supabase (Upsert)** atualiza tabela `whatsapp_connection_status` (`status`, `last_checked_at`).
   - Branch "conectado": atualiza Supabase apenas com `status = 'CONNECTED'`.
4. Configure alerta no n8n (Slack/Email) na branch desconectado.

## 4. Integração com o painel Conexão

- Utilize o endpoint `/status` fornecido em `src/server.js`.
- O frontend deve consultar periodicamente (ex.: SWR/polling a cada 15s) para renderizar os cards "Desconectado", "Conectando" ou "Conectado".
- O retorno inclui campos `status`, `lastCheckedAt`, `lastConnectedAt` e `attemptingReconnect`.

### Variáveis de ambiente sugeridas

| Variável | Uso |
| --- | --- |
| `EVOLUTION_API_BASE_URL` | URL pública da Evolution API (ex.: `https://evolution.example.com`). |
| `EVOLUTION_API_TOKEN` | Token global (header `Authorization`) utilizado pelos workflows de monitoramento/envio. |
| `EVOLUTION_INSTANCE_KEY` | Instance key principal usada pelo backend para fallback. |
| `EVOLUTION_INSTANCE_TOKEN` | Token específico da instância padrão (para autenticação via backend). |
| `EVOLUTION_INSTANCES` | Lista separada por vírgula de instâncias monitoradas pelo n8n. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Credenciais utilizadas pelo backend e pelos workflows para inserir/consultar dados. |
| `SUPABASE_STATUS_TABLE` | Nome da tabela de status; padrão `whatsapp_connection_status`. |

> Consulte `supabase/schema.sql` para criação das tabelas necessárias e `n8n/*.json` para importar workflows prontos.
