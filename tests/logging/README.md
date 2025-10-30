# Plano de validação de logs

O script `log_validation.py` executa uma bateria de testes para garantir que os logs de Supabase, n8n e Evolution API estão chegando ao bucket central e permanecendo com a retenção esperada.

## Etapas

1. **Teste de carga leve**
   - Envia `--samples` requisições simultâneas para cada serviço utilizando `httpx` e mede latência.
2. **Simulação de falhas**
   - Dispara uma requisição com `{"simulate_failure": true}` para forçar erro 5xx na Evolution API.
   - Permite verificar se alertas Slack foram emitidos e se o log aparece no bucket `services/evolution/`.
3. **Validação de retenção**
   - Lista objetos no S3 (`central-audit-logs`) para prefixos do dia corrente.

## Uso

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r tests/logging/requirements.txt
CENTRAL_LOG_BUCKET=central-audit-logs \
SUPABASE_TEST_ENDPOINT=https://supabase.internal/rest/v1/health \
N8N_TEST_WEBHOOK=https://n8n.internal/webhook/test \
EVOLUTION_TEST_ENDPOINT=https://evolution-api.internal/api/messages \
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
python tests/logging/log_validation.py --samples 50 --concurrency 10
```

O script gera saída agregada com total de respostas por intervalo de status HTTP e latência média. Ele retorna código de saída diferente de zero caso alguma validação falhe.
