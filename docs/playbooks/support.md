# Playbook Geral de Suporte

Este playbook descreve fluxos de atendimento, escalonamento e comunicação para incidentes e solicitações de suporte.

## Princípios
- Priorize a segurança dos dados e continuidade do serviço.
- Registre todas as interações no sistema de tickets.
- Comunique-se com clareza e atualize as partes interessadas frequentemente.

## Classificação de Incidentes
| Severidade | Critérios | Objetivo de SLA |
|------------|-----------|-----------------|
| **Sev 1**  | Indisponibilidade total ou impacto crítico a clientes | 15 min para resposta inicial |
| **Sev 2**  | Degradação significativa ou risco de perda de dados | 30 min |
| **Sev 3**  | Impacto moderado com workaround disponível | 2 h |
| **Sev 4**  | Dúvidas, solicitações administrativas | 8 h |

## Fluxo de Escalonamento
1. **Triagem inicial**
   - Avalie severidade com base na tabela acima.
   - Confirme se já existe incidente correlato aberto.
2. **Resposta de Primeira Linha (L1)**
   - Registrar ticket e acionar plantonista via Slack `#suporte-plantao`.
   - Consultar SOP relevante para diagnóstico e mitigação.
3. **Escalonamento L2** (Equipe Técnica)
   - Escalar via menção `@oncall-dev` no Slack e abrir alerta no PagerDuty.
   - Transferir todo o contexto do ticket, incluindo passos já executados.
4. **Escalonamento L3** (Gestão/Produto)
   - Quando impacto é Sev1 ou bloqueio prolongado.
   - Notificar gerência via Slack `#incident-room` e telefone de emergência.
5. **Post-mortem**
   - Agendar reunião pós-incidente em até 48 h.
   - Arquivar relatório em `docs/postmortems/`.

## Canais de Comunicação
- **Slack**
  - `#suporte-plantao`: coordenação operacional em tempo real.
  - `#incident-room`: incidentes Sev1 e comunicação executiva.
  - DM para transferir informações sensíveis (acesso restrito).
- **E-mail**
  - `suporte@empresa.com`: notificações formais e registro externo.
- **Telefone de plantão**
  - +55 (11) 99999-0000 para incidentes críticos quando Slack indisponível.
- **Status Page**
  - Atualizações públicas em `status.empresa.com` seguindo templates de comunicação.

## Rotina de Comunicação
1. Atualizações públicas a cada 30 minutos para Sev1, 60 minutos para Sev2.
2. Internamente, atualizar `#incident-room` sempre que houver mudança de estado.
3. Manter log cronológico no ticket com timestamp e autor.

## Encerramento do Incidente
- Validar com cliente/área solicitante que o serviço está normalizado.
- Atualizar ticket com resumo, causa raiz preliminar e ações.
- Informar na `status page` sobre resolução e próximos passos.

## Checklist Rápido
- [ ] Ticket registrado e categorizado.
- [ ] Escalonamento correto acionado.
- [ ] Comunicação interna e externa feita conforme SLA.
- [ ] Acompanhamento contínuo documentado.
- [ ] Post-mortem agendado (quando aplicável).

## Histórico de Revisões
- 2024-05-06: Versão inicial criada; pendente revisão formal com equipe de suporte.
