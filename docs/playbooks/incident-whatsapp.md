# SOP: Incidente no Canal WhatsApp

## Objetivo
Orientar a equipe de suporte na identificação, mitigação e comunicação de incidentes que afetem o canal de atendimento via WhatsApp.

## Critérios de Disparo
- Clientes reportando ausência de respostas automáticas ou humanas.
- Erros 5xx ou 4xx recorrentes na API do WhatsApp Business.
- Queda no volume de mensagens processadas detectada em dashboards.

## Diagnóstico
1. Confirmar severidade (tipicamente Sev1 ou Sev2) e registrar ticket.
2. Verificar status da API Facebook/Meta em <https://status.whatsapp.com/>.
3. Analisar logs no monitoramento (`dashboard: whatsapp-ops`).
4. Validar credenciais e tokens no Vault (`secret/whatsapp/api`).
5. Se integração customizada, revisar filas na Supabase (`queue_whatsapp_events`).

## Mitigação
1. Reiniciar workers responsáveis (`service whatsapp-worker restart`).
2. Se tokens expirados, gerar novos via runbook `vault renew whatsapp`.
3. Redirecionar atendimento para canal alternativo (e-mail/telefone) usando mensagem automática.
4. Se incidente externo (Meta), habilitar resposta padrão informando indisponibilidade.
5. Solicitar apoio da engenharia de integrações (L2) para debugging aprofundado.

## Comunicação
- **Interna:** atualizar Slack `#incident-room` a cada 30 minutos enquanto durar o impacto.
- **Clientes:** publicar nota na Status Page com template abaixo.
- **Gestão:** acionar gerente de suporte via telefone em casos Sev1.

### Template de Comunicação (Status Page)
```
Título: Intermitência no atendimento via WhatsApp
Início: <timestamp>
Descrição: Estamos enfrentando instabilidade no canal WhatsApp. Nossa equipe está atuando com prioridade máxima. Atualizaremos este comunicado a cada 30 minutos.
Impacto: Clientes podem não receber respostas ou sofrer atrasos.
Próxima atualização: <timestamp +30m>
```

## Encerramento
1. Validar retomada do fluxo normal de mensagens por 30 minutos.
2. Atualizar ticket com causa raiz e ações corretivas.
3. Informar clientes sobre normalização e remover mensagens automáticas de contingência.
4. Registrar lições aprendidas no post-mortem.

## Histórico de Revisões
- 2024-05-06: Versão inicial; feedback com equipe de suporte agendado.
