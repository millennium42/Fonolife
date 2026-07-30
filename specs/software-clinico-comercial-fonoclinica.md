# Software Clínico-Comercial Fonoclínica

## Contexto
Em 30/07/2026 a proposta técnica passou a exigir que o Fonolife opere como um software web clínico, comercial e financeiro integrado, com CRM real, agenda médica transacional, prontuário longitudinal, caixa/POS, estoque, contas a pagar, custeio por atendimento e demonstração local reproduzível via Docker Compose.

O estado atual do repositório já entrega um monólito modular com Fastify, PostgreSQL, React/Vite, RBAC (`admin`, `operator`, `doctor`), auditoria append-only, idempotência para vendas/financeiro/estoque, catálogo/estoque, vendas vinculadas a paciente, recebíveis, agenda médica baseada em `follow_up_tasks`, timeline clínica baseada em `patient_events`, anexos/laudos, importação CSV parcial e seed demo automática em `APP_ENV=demo`.

## Estado Atual Reaproveitável
- Backend modular em `src/modules/*`, com bootstrap único em `src/app.ts`.
- Banco PostgreSQL com migrador idempotente e execução automática no boot.
- `patients`, `patient_events` e `follow_up_tasks` como base de CRM clínico/pós-venda.
- `sales`, `receivable_installments` e `financial_entries` como ledger financeiro append-only.
- `products`, `services`, `service_products` e `inventory_movements` como base de catálogo, estoque e CMV.
- `audit_events`, `user_sessions`, RBAC e autorização por objeto como base de rastreabilidade.
- Seed demo já isolada por ambiente e com dados sintéticos.
- `compose.yaml` já sobe `db`, `clamav` e `app`, com app em `http://localhost:3000`.

## Lacunas
- Falta CRM multientidade separado de `patients`, com contas, contatos, oportunidades, pipelines, stages e atividades.
- Falta agenda clínica transacional com entidade própria de consulta, disponibilidade, bloqueios, conflito, remarcação e status.
- O prontuário clínico ainda não é estruturado por atendimento/appointment.
- O POS não aceita atendimento avulso sem paciente.
- Falta contas a pagar.
- Falta custeio analítico por atendimento com honorários, insumos, produtos e margem.
- Importação/exportação ainda cobre só pacientes e lançamentos financeiros.
- A UI ainda não expõe os módulos centrais da proposta.

## Objetivo
Entregar localmente, para demonstração, uma expansão do Fonolife que mantenha o monólito modular atual e passe a cobrir os fluxos clínicos, comerciais e financeiros descritos na proposta de 30/07/2026, com prova reproduzível por `docker compose up`.

## Escopo
### Incluído
- CRM operacional com contas, contatos, oportunidades, pipelines, stages e atividades.
- Agenda clínica transacional com appointments, disponibilidade, bloqueios, conflito, remarcação e status.
- Prontuário longitudinal integrado ao appointment, ao paciente e ao CRM.
- POS com venda vinculada a paciente e venda avulsa.
- Contas a pagar, recebíveis, caixa e custeio por atendimento.
- Importação/exportação CSV ampliadas para os módulos novos.
- UI mínima necessária para operar e demonstrar o fluxo ponta a ponta.
- Seeds, migrações, testes e ajustes de compose/bootstrap necessários para a demo local.

### Fora do escopo
- Integrações externas não citadas na proposta.
- Multiempresa real com isolamento físico por tenant.
- Aplicativo mobile nativo.
- Produção, deploy externo, billing, NF-e, mensageria externa ou automações fora do monólito.
- Redesign amplo do design system sem necessidade direta da spec.

## Requisitos Exatos
- REQ-001: O sistema deve manter `company_accounts` como contas financeiras/caixas e introduzir um CRM separado com `crm_accounts`, sem reaproveitar `company_accounts` como entidade comercial.
- REQ-002: `crm_accounts` deve permitir cadastro, listagem, filtro e edição de contas comerciais com `name`, `account_type`, `document`, `phone`, `email`, `owner_user_id`, `active`, `notes` e `custom_fields`.
- REQ-003: `crm_contacts` deve permitir cadastro, listagem, filtro e edição de contatos com vínculo opcional a `crm_account`, vínculo opcional a `patient`, canais de contato e `custom_fields`.
- REQ-004: `crm_pipelines` e `crm_stages` devem permitir pelo menos um pipeline ativo com etapas ordenadas e configuráveis por administrador, reutilizado pela UI Kanban.
- REQ-005: `crm_opportunities` deve permitir criação, edição, listagem, filtro e movimentação entre stages com `title`, `pipeline_id`, `stage_id`, `account_id`, `contact_id`, `patient_id`, `owner_user_id`, `priority`, `status`, `estimated_value_cents`, `probability_percent`, `lead_source`, `expected_close_on`, `notes` e `custom_fields`.
- REQ-006: Cada movimentação, criação e encerramento de oportunidade deve gerar auditoria e histórico visível no próprio CRM.
- REQ-007: `crm_activities` deve registrar tarefas/notas/follow-ups ligados a `account`, `contact`, `opportunity`, `patient` ou `appointment`, com `activity_type`, `subject`, `description`, `due_at`, `completed_at`, `created_by` e `owner_user_id`.
- REQ-008: A UI deve expor um funil comercial em Kanban e uma visão em lista com filtros por pipeline, stage, owner, prioridade, status e período.
- REQ-009: O módulo de agenda deve introduzir `appointments` como entidade própria, com `patient_id` opcional, `opportunity_id` opcional, `doctor_id`, `unit_name`, `room_name`, `specialty`, `appointment_type`, `scheduled_start`, `scheduled_end`, `status`, `notes` e `created_by`.
- REQ-010: O módulo de agenda deve introduzir disponibilidade e bloqueios explícitos por profissional em tabelas próprias, suficientes para a demo local operar conflito, encaixe e indisponibilidade.
- REQ-011: O backend deve impedir, no banco e/ou domínio, conflito de horário para o mesmo `doctor_id` ou a mesma `room_name` entre appointments ativos.
- REQ-012: O fluxo de appointment deve suportar criação, confirmação, remarcação, cancelamento, check-in, início e conclusão, com histórico rastreável de transições.
- REQ-013: Deve ser possível criar appointment a partir de uma oportunidade CRM e também a partir do fluxo de POS/atendimento comercial.
- REQ-014: O prontuário clínico deve introduzir `clinical_encounters` vinculados a `appointment_id` e `patient_id`, com evolução, observações clínicas, orientações, resumo, anexos/referências existentes e responsável clínico.
- REQ-015: Ao concluir um encounter clínico, o sistema deve atualizar a visão longitudinal do paciente combinando appointments, encounters, patient events, laudos, anexos e vendas.
- REQ-016: O módulo de médicos deve exibir agenda operacional baseada em appointments e permitir acesso ao encounter e ao histórico do paciente autorizado.
- REQ-017: O POS deve aceitar venda com `patient_id` opcional; quando ausente, a venda deve permanecer como atendimento avulso e não deve exigir prontuário.
- REQ-018: O POS deve continuar suportando produto e serviço, preservando baixa de estoque, ledger financeiro, idempotência e geração de recebíveis, e deve opcionalmente criar appointment quando solicitado pelo operador.
- REQ-019: O financeiro deve introduzir `accounts_payable` com criação, listagem, filtro, baixa/liquidação e estorno compensatório, usando `financial_entries` como evidência econômica realizada.
- REQ-020: O financeiro deve introduzir `appointment_costings` com snapshot por atendimento contendo pelo menos `appointment_id`, `patient_id`, `doctor_id`, `service_revenue_cents`, `product_revenue_cents`, `honorarium_cents`, `supply_cost_cents`, `other_cost_cents`, `total_cost_cents` e `margin_cents`.
- REQ-021: O cálculo de custeio por atendimento deve considerar a receita e os custos conhecidos no momento da conclusão do atendimento, sem consultar valores mutáveis futuros.
- REQ-022: A UI financeira deve expor contas a pagar, recebíveis, resumo realizado e visão analítica básica de margem por atendimento.
- REQ-023: A importação CSV administrativa deve aceitar ao menos `patient`, `financial`, `crm_account`, `crm_contact`, `crm_opportunity`, `appointment` e `payable`.
- REQ-024: A exportação CSV deve existir ao menos para lançamentos financeiros, contas a pagar, oportunidades e agenda/appointments, mantendo neutralização de fórmula.
- REQ-025: A UI deve incluir páginas ou abas de `CRM`, `Agenda Clínica`, `Atendimentos`, `Caixa (PDV)`, `Pacientes`, `Financeiro`, `Contas a Pagar`, `Estoque & Catálogo` e `Importação/Exportação`, respeitando o papel do usuário.
- REQ-026: O seed demo deve criar dados sintéticos coerentes para CRM, agenda, encounters, POS, contas a pagar, recebíveis e custeio, suficientes para a demonstração ponta a ponta.
- REQ-027: `docker compose up --build --wait` deve deixar banco e aplicação utilizáveis localmente, com migrações e seed demo automáticas.
- REQ-028: O sistema deve preservar os endpoints existentes usados pelos testes atuais, adicionando os novos contratos sem quebrar o comportamento aceito do plano anterior salvo quando a spec exigir extensão compatível.

## Restrições
- CON-001: A solução deve permanecer um monólito modular em Node.js/TypeScript + Fastify + React/Vite.
- CON-002: O banco deve permanecer PostgreSQL; não usar ORM.
- CON-003: Não criar microserviços, filas externas nem abstrações especulativas.
- CON-004: Todos os valores monetários devem permanecer em centavos inteiros.
- CON-005: Regras e invariantes devem residir no domínio e/ou no banco, não apenas na UI.
- CON-006: Auditoria, rastreabilidade e histórico financeiro/clínico devem permanecer append-only quando aplicável.
- CON-007: Idempotência existente deve ser preservada e estendida para rotas mutáveis novas sensíveis a replay.
- CON-008: O RBAC atual (`admin`, `operator`, `doctor`) deve ser preservado; novos módulos devem se encaixar nele sem criar papéis extras.
- CON-009: Os dados de demonstração devem ser sintéticos; não incluir dados clínicos reais, credenciais reais ou identificadores reais de pacientes.
- CON-010: A entrega é local e demonstrável; a spec não autoriza alegar produção ou deploy externo.
- CON-011: Reaproveitar a base atual antes de criar estruturas novas; nenhuma refatoração ampla fora do escopo direto.

## Entidades e Regras de Domínio
### CRM
- `crm_accounts`
  - Representa empresa, convênio, parceiro ou origem comercial.
  - `account_type` inicial da demo: `company`, `insurer`, `partner`, `referrer`, `other`.
  - `document` é opcional, mas quando presente deve ser normalizado e único por tipo.
- `crm_contacts`
  - Pode existir sem paciente.
  - Pode ser ligado a um `patient_id` existente quando o contato já está convertido em paciente.
- `crm_pipelines`
  - Pipeline ativo/inativo.
- `crm_stages`
  - Ordem explícita por `position`.
  - Deve haver ao menos um stage ativo por pipeline.
- `crm_opportunities`
  - `estimated_value_cents >= 0`.
  - `probability_percent` entre `0` e `100`.
  - `status` inicial da demo: `open`, `won`, `lost`, `archived`.
  - `won` ou `lost` exige stage terminal e histórico registrado.
- `crm_activities`
  - `activity_type` inicial: `note`, `task`, `follow_up`, `call`, `meeting`.
  - Não apagar histórico; concluir/cancelar em vez de deletar.

### Agenda Clínica
- `doctor_availability_blocks`
  - Janelas positivas ou bloqueios explícitos por médico.
- `appointments`
  - `status` inicial: `scheduled`, `confirmed`, `checked_in`, `in_progress`, `completed`, `cancelled`, `no_show`.
  - `scheduled_end > scheduled_start`.
  - `patient_id` pode ser nulo apenas para pré-reserva comercial ou atendimento avulso ainda não convertido.
  - `room_name` e `unit_name` ficam como texto livre nesta iteração.
- `appointment_events`
  - Guarda remarcação, confirmação, cancelamento, mudança de status e conflitos resolvidos.

### Prontuário
- `clinical_encounters`
  - Um encounter pertence a um appointment concluído ou em progresso.
  - Guarda `chief_complaint`, `evolution`, `clinical_notes`, `guidance`, `plan`, `summary`.
  - Deve registrar `doctor_id`, `patient_id`, `appointment_id`, `created_by`.

### Financeiro
- `accounts_payable`
  - `amount_cents > 0`.
  - `status` inicial: `open`, `partially_settled`, `settled`, `cancelled`.
  - Liquidação gera `financial_entries` do tipo `expense`.
- `appointment_costings`
  - Snapshot imutável por appointment concluído.
  - `margin_cents = total_revenue_cents - total_cost_cents`.
  - `total_cost_cents = honorarium_cents + supply_cost_cents + other_cost_cents`.

## Contratos HTTP
### Contratos preservados
- Permanecem válidos os endpoints críticos já aceitos do plano anterior para auth, pacientes, catálogo, estoque, vendas, financeiro, médicos, anexos, relatórios, privacidade e dashboard.

### Novos contratos mínimos
- `GET/POST/PATCH /api/crm/accounts`
- `GET/POST/PATCH /api/crm/contacts`
- `GET/POST/PATCH /api/crm/pipelines`
- `GET/POST/PATCH /api/crm/pipelines/:pipelineId/stages/:stageId`
- `GET/POST/PATCH /api/crm/opportunities`
- `POST /api/crm/opportunities/:id/move`
- `GET/POST/PATCH /api/crm/activities`
- `GET/POST /api/appointments`
- `GET/PATCH /api/appointments/:id`
- `POST /api/appointments/:id/confirm`
- `POST /api/appointments/:id/reschedule`
- `POST /api/appointments/:id/cancel`
- `POST /api/appointments/:id/check-in`
- `POST /api/appointments/:id/start`
- `POST /api/appointments/:id/complete`
- `GET/POST /api/appointments/blocks`
- `GET/POST /api/clinical/encounters`
- `GET /api/patients/:id/clinical-record`
- `GET/POST /api/finance/payables`
- `POST /api/finance/payables/:id/settle`
- `POST /api/finance/payables/:id/reverse`
- `GET /api/finance/appointment-costing`
- `GET /api/appointments.csv`
- `GET /api/crm/opportunities.csv`
- `GET /api/finance/payables.csv`

### Regras de contrato
- Respostas de erro devem continuar em `application/problem+json`.
- Rotas mutáveis críticas novas devem aceitar `clientRequestId` e devolver `409` quando a mesma chave vier com payload econômico diferente.
- Rotas de listagem devem aceitar filtros coerentes com a UI e paginação simples.

## Fluxos de UI
### CRM
1. Usuário abre `CRM`.
2. Cadastra conta e contato, cria oportunidade, escolhe pipeline/stage.
3. Move card no Kanban, registra atividade e agenda consulta/assessment.

### Agenda / Consulta
1. Usuário abre `Agenda Clínica`.
2. Seleciona profissional, período e filtros.
3. Cria appointment, vê conflito ou sucesso.
4. Confirma/remarca/check-in/inicia/conclui.

### Clínico / Prontuário
1. Médico abre agenda e entra em um appointment.
2. Registra encounter clínico.
3. Visualiza histórico longitudinal do paciente com agenda, notas, vendas, anexos e laudos.

### Financeiro / Caixa / Custeio
1. Operador faz venda com paciente ou avulsa.
2. Opcionalmente cria appointment.
3. Admin baixa contas a receber e contas a pagar.
4. Admin consulta margem por atendimento no financeiro.

## Migrações e Banco
- Criar novas migrações incrementais, sem reescrever as existentes.
- Adicionar índices para filtros por stage, owner, patient, doctor, period e status.
- Adicionar constraints/checks para valores monetários, enumerações, datas e conflito lógico.
- Adicionar triggers/restrições append-only quando houver histórico que não pode ser apagado.
- Preservar `schema_migrations` e compatibilidade com o migrador atual.

## Testes e Evidências
- Cobrir domínio novo com testes unitários focados em validações e centavos.
- Cobrir contratos HTTP novos e preservar os existentes.
- Cobrir edge cases de conflito de agenda, idempotência, RBAC, walk-in POS, contas a pagar e custeio.
- Executar ao menos `npm run test`, `npm run build` e a subida local por `docker compose up --build --wait`.
- Quando o ambiente permitir, executar smoke flows sobre endpoints críticos da demo.

## Plano de Entrega em Fases
1. Fase A: schema/migrations, domínio e rotas backend para CRM, agenda, encounter, payables e costing.
2. Fase B: seed demo, ajustes no POS/import-export e UI mínima dos novos módulos.
3. Fase C: testes, revisão de conformidade, correções e prova local por Docker Compose.

## Casos Extremos e Falhas
- EDGE-001: Criar ou remarcar appointment em horário já ocupado pelo mesmo médico ou sala deve falhar com `409`.
- EDGE-002: Appointment sobre bloqueio explícito deve falhar com `409`, salvo fluxo marcado como encaixe e auditado.
- EDGE-003: Doctor não pode visualizar ou editar CRM/appointment/patient fora do escopo autorizado; a negação deve ser auditada.
- EDGE-004: Venda avulsa sem `patient_id` deve funcionar, mas não pode criar prontuário automaticamente.
- EDGE-005: Tentativa de reutilizar `clientRequestId` com payload econômico diferente em vendas, payables, appointments cobrados ou liquidações deve retornar `409`.
- EDGE-006: Não deve ser possível concluir appointment sem `scheduled_start/scheduled_end` válidos nem gravar encounter sem `doctor_id`.
- EDGE-007: Não deve ser possível liquidar uma conta a pagar duas vezes sem estorno compensatório.
- EDGE-008: Importação CSV idêntica deve responder de forma idempotente; arquivo inválido deve registrar erros sem corromper o lote.
- EDGE-009: Custeio de appointment concluído deve congelar valores; mudança futura de preço/CMV do catálogo não altera snapshots passados.
- EDGE-010: `demo:reset` e seeds destrutivas devem continuar recusadas fora do ambiente demo isolado.

## Definição de Concluído
- DONE-001: `specs/software-clinico-comercial-fonoclinica.md` existe e cobre contexto, objetivo, escopo, requisitos, restrições, edge cases e critérios de prova.
- DONE-002: Todos os itens `REQ` e `CON` acima têm implementação observável ou evidência explícita de preservação.
- DONE-003: Existe ao menos um fluxo CRM demonstrável: conta -> contato -> oportunidade -> stage move -> atividade -> appointment.
- DONE-004: Existe ao menos um fluxo de agenda demonstrável: agendamento -> conflito ou sucesso -> confirmação/remarcação -> conclusão.
- DONE-005: Existe ao menos um fluxo clínico demonstrável: appointment -> encounter -> prontuário longitudinal.
- DONE-006: Existe ao menos um fluxo financeiro demonstrável: POS/recebível ou payable/costing com valores em centavos e rastreabilidade.
- DONE-007: `docker compose up --build --wait` deixa o app acessível localmente com migrações e seed demo.
- DONE-008: A validação final registra comandos executados, resultados resumidos, URLs locais, credenciais/demo access, roteiro curto e limites remanescentes.

## Critérios de Aceite
- O review só passa quando não houver lacuna material entre proposta, spec e build.
- Nenhum item novo pode depender de comportamento apenas visual; deve existir prova por código, teste, runtime ou banco.
- Nenhuma conclusão pode alegar produção, deploy externo ou integração não executada.

## Riscos e Rollback
- Risco: crescimento excessivo do frontend monolítico em `web/src/main.tsx`.
  - Mitigação: adicionar somente os componentes/telas necessários para a demo, sem refactor estrutural amplo.
- Risco: conflito com worktree já sujo.
  - Mitigação: preservar mudanças não relacionadas e editar só o necessário.
- Risco: compose lento por build completo.
  - Mitigação: validar primeiro testes/build local e depois subir compose com espera explícita.
- Rollback: como a entrega é local, o rollback é restaurar o checkout anterior, remover containers/volume demo e reexecutar o compose conhecido do estado anterior.

## Dúvidas em Aberto
- DUV-001: Nesta iteração, `unit_name` e `room_name` serão texto livre em vez de módulo mestre separado.
- DUV-002: Convênios entram como `crm_accounts.account_type='insurer'`, não como entidade dedicada.
- DUV-003: Anexos CRM fora do contexto de paciente podem ficar restritos a notas/referências textuais nesta demo, desde que o prontuário/anexos clínicos existentes permaneçam íntegros.
