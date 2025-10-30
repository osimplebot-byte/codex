# Monitoring Toolkit

Este diretório centraliza scripts e manifests que automatizam o monitoramento da Evolution API.

## Componentes

- `evolution_health_check.py`: script Python que consulta o endpoint `/api/health` e envia alertas para o Slack quando a latência ou o status divergem do esperado.
- `cronjob.yaml`: CronJob Kubernetes que executa o script a cada 5 minutos.
- `configmap.yaml`: disponibiliza o código do health check como ConfigMap montado no job.
- `requirements.txt`: dependências Python do script (atualmente apenas `requests`).

## Execução local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r monitoring/requirements.txt
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
EVOLUTION_HEALTH_URL=https://evolution-api.internal/api/health \
python monitoring/evolution_health_check.py
```

O script retorna código de saída `0` quando o serviço está saudável, `1` quando há degradação (status inesperado ou latência alta) e `2` em falhas de rede.
