# SOP: Incidente de Quota da OpenAI

## Objetivo
Garantir resposta rápida a incidentes relacionados a limites de uso da API da OpenAI que impactem funcionalidades dependentes de IA.

## Critérios de Disparo
- Respostas de erro `429` ou mensagens "quota exceeded" em logs.
- Alertas automáticos do dashboard `openai-usage` acima de 90% do limite diário/mensal.
- Reclamações de clientes sobre respostas indisponíveis ou lentas.

## Diagnóstico
1. Classificar severidade (Sev1 se todas as requisições falham; Sev2 se degradação parcial).
2. Confirmar em `dashboard: openai-usage` e no portal da OpenAI (<https://platform.openai.com/usage>) o consumo atual.
3. Revisar chaves em uso e limites aplicados (organização e projetos).
4. Identificar se há jobs em lote ou scripts em execução anormal consumindo quota.
5. Consultar logs de erro (`kibana: service=openai-proxy`).

## Mitigação
1. Aplicar throttling temporário ou desligar features não críticas que consomem quota elevada.
2. Solicitar aumento emergencial de quota pelo portal da OpenAI (botão "Request Increase") e registrar ticket.
3. Alternar tráfego para modelo de backup ou provedor alternativo, conforme guia `docs/ai-fallbacks.md`.
4. Se for vazamento de chave, rotacionar credenciais no Vault (`secret/openai/api`) e redistribuir.
5. Notificar time de produto para avaliar comunicação proativa com clientes premium.

## Comunicação
- **Interna:** Slack `#incident-room` com atualizações a cada 45 minutos.
- **Clientes:** Status Page utilizando template abaixo quando houver impacto perceptível.
- **Executivo:** E-mail para diretoria (`diretoria@empresa.com`) quando estimativa de resolução > 4h.

### Template de Comunicação (Status Page)
```
Título: Limite de uso da API OpenAI atingido
Início: <timestamp>
Descrição: Identificamos que o consumo de nossa integração com a OpenAI atingiu o limite disponível. Estamos adotando medidas de contenção e solicitando aumento de quota.
Impacto: Funcionalidades de IA podem apresentar lentidão ou falhas temporárias.
Próxima atualização: <timestamp +45m>
```

## Encerramento
1. Validar normalização do consumo (abaixo de 80% do limite) e restabelecimento das features.
2. Atualizar ticket com causa raiz (ex.: uso atípico, bug, aumento de clientes) e plano de prevenção.
3. Garantir que as ações temporárias (throttling, features desligadas) foram revertidas.
4. Documentar melhorias de monitoramento e capacidade.

## Histórico de Revisões
- 2024-05-06: Versão inicial; revisão da equipe de suporte pendente para 07/05.
