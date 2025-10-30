# SOP: Incidente na Supabase

## Objetivo
Definir passos claros para lidar com indisponibilidades ou degradações em serviços hospedados na Supabase (Postgres, Auth, Storage, Functions).

## Critérios de Disparo
- Alertas de disponibilidade (Pingdom/Grafana) indicando falha em endpoints críticos.
- Erros recorrentes 5xx em APIs dependentes da Supabase.
- Reclamações de clientes sobre autenticação ou acesso a dados impossibilitado.

## Diagnóstico
1. Classificar severidade; incidentes que impedem login ou leitura crítica são Sev1.
2. Checar status oficial em <https://status.supabase.com/>.
3. Revisar gráficos de métricas (`dashboard: supabase-core`) e logs (`kibana: service=supabase`).
4. Validar se há deploy recente correlacionado (consultar `CHANGELOG.md` interno).
5. Confirmar se incidentes são restritos a um projeto ou global (consultar painel da Supabase).

## Mitigação
1. Se problema localizado, promover failover para instância réplica (`runbooks/failover-supabase.md`).
2. Ajustar limites de conexão e reiniciar serviços afetados via painel (`Project Settings > Database > Restart`).
3. Ativar modo somente leitura em features dependentes para evitar corrupção de dados.
4. Se Auth indisponível, habilitar fallback de token estático temporário e comunicar clientes chave.
5. Coordenar com suporte Supabase abrindo ticket urgente (Plano Enterprise) e anexar logs relevantes.

## Comunicação
- **Interna:** Slack `#incident-room` com updates a cada 30 minutos (Sev1) ou 60 minutos (Sev2).
- **Clientes:** Status Page com template abaixo, além de e-mail para contas estratégicas.
- **Fornecedora:** Ticket em <https://support.supabase.com/> com ID referenciado no nosso ticket interno.

### Template de Comunicação (Status Page)
```
Título: Instabilidade em serviços Supabase
Início: <timestamp>
Descrição: Identificamos instabilidade em componentes hospedados na Supabase. Estamos trabalhando com o suporte da fornecedora e aplicando medidas de contingência.
Impacto: Autenticação e acesso a dados podem apresentar falhas ou lentidão.
Próxima atualização: <timestamp +30m>
```

## Encerramento
1. Validar estabilidade por pelo menos 60 minutos com monitoramento normalizado.
2. Registrar causa raiz fornecida pela Supabase ou identificada internamente.
3. Documentar ajustes de infraestrutura (ex.: failover, limites) e reverter contigências.
4. Atualizar o ticket e agendar post-mortem quando houver impacto Sev1.

## Histórico de Revisões
- 2024-05-06: Versão inicial; revisão com equipe de suporte programada.
