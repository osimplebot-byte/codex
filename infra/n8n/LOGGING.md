# n8n Logging Map

## Pontos de geração de logs

| Componente | Endpoint / Ação | Origem do log |
|------------|-----------------|---------------|
| Workflow executions | HTTP Webhook Trigger (`/webhook/*`) | Loga payloads e status de execução. |
| Internal queue | `bull` events | Logs de falhas/retries armazenados no Redis e emitidos para stdout. |
| Credential API | `/rest/credentials/*` | Registra acesso e alteração de credenciais. |
| Instance health | `/healthz` | Endpoint usado por monitores externos; resposta logada a cada chamada. |

## Configurações principais

| Local | Parâmetro | Descrição |
|-------|-----------|-----------|
| `infra/n8n/docker-compose.yml` | `logging.driver` | Envia stdout/stderr para servidor Syslog central. |
| `infra/n8n/docker-compose.yml` | `N8N_LOG_LEVEL` | Define nível mínimo (`info`, `warn`, `error`). |
| `infra/n8n/docker-compose.yml` | `N8N_LOG_OUTPUT` | Mantém formato `json` para parsing fácil no collector. |
| Variáveis | `N8N_LOG_SYSLOG_ADDRESS` | Endereço do collector (`udp://logs.internal:514`). |

## Retenção

- O collector Syslog mantém logs crus por 30 dias.
- Eventos críticos são replicados para o mesmo bucket S3 do Supabase sob `integrations/n8n/`.
