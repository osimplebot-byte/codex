# Evolution API Logging Map

## Principais endpoints

| Endpoint | Propósito | Eventos de log |
|----------|-----------|----------------|
| `/api/messages` | Envio e recebimento de mensagens WhatsApp. | Registra `request_id`, `phone_number`, status de entrega. |
| `/api/contacts` | CRUD de contatos. | Logs de auditoria para criação/alteração. |
| `/api/health` | Health check básico HTTP 200. | Monitorado pelo cronjob em `monitoring/`. |
| `/api/webhooks/*` | Webhooks externos. | Logs detalham origem (`provider`) e payload resumido. |

## Configurações

| Local | Parâmetro | Função |
|-------|-----------|--------|
| `services/evolution/config.yaml` | `logging.level` | Nível (`info`, `debug`). |
| `services/evolution/config.yaml` | `logging.sinks` | Destinos configurados (stdout, Loki, S3). |
| `monitoring/evolution_health_check.py` | `EVOLUTION_HEALTH_URL` | Endpoint monitorado para alertas. |

## Retenção

- Logs de aplicação são enviados para o mesmo bucket S3 sob `services/evolution/` com retenção de 45 dias.
- Eventos de erro crítico (`severity >= error`) geram alerta Slack imediato via monitoramento.
