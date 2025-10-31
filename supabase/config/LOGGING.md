# Supabase Logging & Audit Map

Este documento descreve os principais endpoints e parâmetros de configuração relacionados a logs no Supabase self-hosted.

## Endpoints relevantes

| Endpoint | Descrição | Observações |
|----------|-----------|-------------|
| `/rest/v1/*` | API PostgREST; cada requisição gera entrada de acesso. | Logs roteados para o collector HTTP configurado. |
| `/auth/v1/*` | Serviço de autenticação GoTrue. | Emite eventos de auditoria para logins/sessões. |
| `/realtime/v1/*` | Canal de realtime. | Logs enviados via Vector (ou Logflare) com metadados de conexão. |
| `/functions/v1/*` | Edge Functions. | Logs agrupados por função e request-id. |

## Arquivos e variáveis de configuração

| Local | Chave | Função |
|-------|-------|--------|
| `supabase/config.toml` | `[logging]` | Define nível global de log (`debug`, `info`, etc.). |
| `supabase/config.toml` | `[logging.audit]` | Ativa coleta de audit logs e envia para destino central. |
| `supabase/config.toml` | `[logging.audit.s3]` | Configura bucket S3, credenciais e retenção. |
| Variáveis de ambiente | `LOGFLARE_API_KEY`, `VECTOR_CONFIG_PATH` | Integrações opcionais para roteamento adicional. |

## Retenção e observabilidade

- Os audit logs exportados para S3 seguem particionamento `supabase/audit/YYYY/MM/DD/`.
- Logs transacionais permanecem disponíveis localmente por 14 dias (`retention_days`).
- Recomenda-se habilitar alertas no destino (ex.: DataDog) para eventos críticos (`event_type = 'auth_error'`).
