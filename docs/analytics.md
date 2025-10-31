# Métricas e painéis de onboarding

## Visão geral
O fluxo de onboarding do painel web emite eventos via Segment sempre que o usuário avança pelas etapas descritas abaixo. Os eventos são enviados apenas em ambientes `staging` e `production`. Em ambientes sem chave configurada, os eventos são apenas logados no console para facilitar testes locais sem gerar tráfego real.

- Chave de escrita (`REACT_APP_SEGMENT_WRITE_KEY`) configurada no ambiente.
- Ambiente (`REACT_APP_ENVIRONMENT`) deve ser `staging` ou `production` para liberar o envio.

## Eventos do fluxo
| Evento | Disparo | Propriedades principais |
| --- | --- | --- |
| `OnboardingStarted` | Usuário abre a etapa de boas-vindas. | `stepId`, `status`, `timestamp`, `metadata.product`, `metadata.surface`, `metadata.entryPoint`. |
| `ProfileStepStarted` | Tela de perfil renderizada. | `metadata.requiredFields` lista quais campos devem ser preenchidos. |
| `ProfileStepCompleted` | Formulário de perfil salvo. | `metadata.fieldsCompletedCount`, `metadata.hasWhatsAppNumber`. |
| `BusinessDataStepStarted` | Etapa de dados da IA aberta. | `metadata.datasetTypes`. |
| `BusinessDataStepCompleted` | Dados salvos. | `metadata.faqEntries`, `metadata.catalogItems`, `metadata.toneConfigured`. |
| `ChannelConnectionStepStarted` | Etapa de conexão exibida. | `metadata.availableMethods`, `metadata.supportsWebView`. |
| `ChannelConnectionStepCompleted` | QR code conectado com sucesso. | `metadata.connectionStatus`, `metadata.attempts`. |
| `SummaryStepStarted` | Usuário acessa o checklist final. | `metadata.stepTitle`. |
| `OnboardingCompleted` | Fluxo finalizado. | `metadata.checklistCompleted`. |

Todos os payloads aplicam mascaramento automático para campos potencialmente pessoais (`email`, `phone`, `cpf`, etc.), garantindo conformidade com a LGPD.

## Métricas recomendadas
1. **Taxa de conclusão do onboarding** (`OnboardingCompleted` ÷ `OnboardingStarted`).
2. **Queda por etapa**: comparar contagens `ProfileStepStarted` vs `ProfileStepCompleted`, etc., para detectar gargalos.
3. **Tempo médio por etapa**: calcular diferença entre timestamps consecutivos por usuário (via `timestamp`).
4. **Tentativas de conexão WhatsApp**: média de `metadata.attempts` em `ChannelConnectionStepCompleted` para identificar necessidade de melhorias na UX.
5. **Qualidade dos dados treinados**: acompanhar `metadata.faqEntries` e `metadata.catalogItems` para saber se o cliente alimentou a IA suficientemente.

## Painéis sugeridos
- **Funil de onboarding**: gráfico de barras com eventos de início e conclusão por etapa.
- **Health da base de conhecimento**: tabelas com distribuição de FAQs e itens de catálogo preenchidos.
- **Confiabilidade da conexão**: monitor com percentual de sucesso na etapa de canal e média de tentativas.
- **Alertas operacionais**: gatilho para suporte quando `ChannelConnectionStepCompleted` não ocorre em até 24h após `ChannelConnectionStepStarted`.

## Validação em staging
1. Configure `REACT_APP_ENVIRONMENT=staging` e a chave Segment de testes.
2. Navegue pelo fluxo completo e verifique no debugger do Segment que todos os eventos acima são disparados com payloads mascarados.
3. Confirme que nenhum dado sensível aparece (nomes, telefones ou documentos devem estar como `[REDACTED]`).
4. Repita o fluxo com valores vazios ou incompletos para garantir que os contadores (`fieldsCompletedCount`, `faqEntries`) reflitam corretamente o estado real.

## Conformidade LGPD
- Campos potencialmente pessoais são mascarados automaticamente no client antes do envio.
- Os componentes nunca enviam nomes, telefones ou documentos; apenas contagens, flags e categorias.
- O envio pode ser desativado completamente omitindo a chave do Segment, evitando coleta não autorizada.
