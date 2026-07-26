# Aceite do plano funcional original

Esta matriz comprova o plano original sobre a `main`. “Atendido” significa que há implementação, teste automatizado e evidência executável no repositório. As cinco jornadas transversais estão em `tests/e2e/original-plan-journeys.spec.ts`; invariantes de domínio e banco permanecem nas suítes especializadas indicadas.

## Estoque e catálogo

| REQ | Requisito | Backend | Frontend | Teste | Evidência | Estado |
|---|---|---|---|---|---|---|
| CAT-01 | Aba de estoque | `modules/catalog` | `Inventory` | `original-plan-journeys` J4 | navegação e catálogo renderizados | Atendido |
| CAT-02 | Produtos | rotas de produtos | tabela e modal de produto | `catalog-inventory.test.ts` | cadastro, edição e listagem | Atendido |
| CAT-03 | Serviços | `/api/services` | tabela e modal de serviço | `services.test.ts` | cadastro, edição e listagem | Atendido |
| CAT-04 | CMV de produto | `cost_cents` | campo e tabela | `catalog-inventory.test.ts` | centavos inteiros | Atendido |
| CAT-05 | CMV de serviço | `service_cost_cents` | campo e tabela | `services.test.ts` | centavos inteiros | Atendido |
| CAT-06 | Duração do serviço | `execution_time_minutes` | campo e tabela | `services.test.ts` | domínio valida duração | Atendido |
| CAT-07 | Produtos relacionados | `service_products` | insumos do serviço | `catalog-inventory.test.ts` | relação versionada | Atendido |
| CAT-08 | Quantidade consumida | `quantity` da relação | resumo de insumos | `catalog-inventory.test.ts` | baixa usa quantidade | Atendido |
| CAT-09 | Estoque mínimo | `minimum_stock` | indicador de mínimo | `inventory.test.ts` | saldo e alerta | Atendido |
| CAT-10 | Ajustes por modal | movimentos de estoque | `Modal` de ajuste | `original-plan-journeys` J4 | diálogo acessível | Atendido |
| CAT-11 | Justificativa | validação de movimento | campo obrigatório | `inventory.test.ts` | rejeição sem motivo | Atendido |
| CAT-12 | Baixa automática | transação de venda/serviço | Caixa e prontuário | `catalog-inventory.test.ts` | baixa atômica | Atendido |
| CAT-13 | Cancelamento compensatório | movimento inverso append-only | ação de estorno | `finance-pos-ledger.test.ts` | compensação sem apagar histórico | Atendido |

## Pacientes

| REQ | Requisito | Backend | Frontend | Teste | Evidência | Estado |
|---|---|---|---|---|---|---|
| PAT-01 | Nome clicável em todas as áreas | IDs em respostas | `PatientLink` | `ui-system.test.ts` | componente único e exceções documentadas | Atendido |
| PAT-02 | Prontuário global | `/api/patients/:id` | `Drawer` global | `original-plan-journeys` J1/J2 | abre sem perder a página | Atendido |
| PAT-03 | Retorno ao contexto anterior | estado da página preservado | fechamento do `Drawer` | `accessibility.spec.ts` | foco e contexto restaurados | Atendido |
| PAT-04 | Autorização | `loadAndAuthorizePatient` | erro por contrato | `security-object-lgpd.test.ts` | matriz RBAC/BOLA | Atendido |
| PAT-05 | Timeline | `/timeline` | timeline no prontuário | `patients.test.ts` | eventos imutáveis | Atendido |
| PAT-06 | Vendas | consulta por paciente | seção de vendas | `sales.test.ts` | mesma venda do ledger | Atendido |
| PAT-07 | Serviços | serviço vinculado à venda | seção de vendas/serviços | `catalog-inventory.test.ts` | serviço e insumos | Atendido |
| PAT-08 | Financeiro | recebíveis por paciente | seção financeira | `finance-pos-ledger.test.ts` | ledger canônico | Atendido |
| PAT-09 | Anexos | rotas autorizadas | viewer no prontuário | `secure-attachments.test.ts` | upload, download e quarentena | Atendido |
| PAT-10 | Laudos | rotas autorizadas | emissão e impressão | `medical-reports.test.ts` | documento versionado | Atendido |
| PAT-11 | Médico responsável opcional | `responsible_doctor_id` anulável | seletor opcional | `doctors.test.ts` | vínculo preservado | Atendido |

## Médico

| REQ | Requisito | Backend | Frontend | Teste | Evidência | Estado |
|---|---|---|---|---|---|---|
| MED-01 | Apenas médicos cadastrados | `/api/doctors` | seletor de cadastro | `doctors.test.ts` | consulta por papel | Atendido |
| MED-02 | Apenas ativos em novos vínculos | filtro `active` | opções retornadas pela API | `doctors.test.ts` | inativos excluídos | Atendido |
| MED-03 | Médico vê somente pacientes permitidos | filtro e autorização por objeto | `Meus Pacientes` | `original-plan-journeys` J3 | vínculo permitido e acesso negado | Atendido |
| MED-04 | Histórico não é reatribuído | eventos guardam autor | timeline mostra autor original | `patients.test.ts` | histórico append-only | Atendido |
| MED-05 | Inativação preserva dados | usuário inativo permanece referenciado | histórico continua legível | `doctors.test.ts` | FK sem reatribuição | Atendido |
| MED-06 | Agenda médica | `/api/doctor/schedule` | `DoctorAgenda` | `original-plan-journeys` J3 | agenda filtrada por médico | Atendido |
| MED-07 | Atendimento clínico | `/api/doctor/consultations` | prontuário dos vinculados | `doctors.test.ts` | autorização e evento clínico | Atendido |

## Caixa

| REQ | Requisito | Backend | Frontend | Teste | Evidência | Estado |
|---|---|---|---|---|---|---|
| POS-01 | Aba para operador | RBAC autenticado | `Caixa (PDV)` | `original-plan-journeys` J2 | acesso de operador | Atendido |
| POS-02 | Busca de paciente | `/api/patients` | seletor e busca | `critical-flow.spec.ts` | paciente localizado | Atendido |
| POS-03 | Catálogo | produtos e serviços ativos | catálogo unificado | `original-plan-journeys` J2 | itens carregados | Atendido |
| POS-04 | Carrinho | payload de itens | resumo e quantidades | `original-plan-journeys` J2 | produto e serviço | Atendido |
| POS-05 | Produto | `productId` | adicionar produto | `sales.test.ts` | venda vinculada | Atendido |
| POS-06 | Serviço | `serviceId` | adicionar serviço | `catalog-inventory.test.ts` | venda e baixa de insumo | Atendido |
| POS-07 | Parcelas | recebíveis em centavos | seletor de parcelas | `finance-pos-ledger.test.ts` | soma exata | Atendido |
| POS-08 | Médico | vínculo responsável do paciente | prontuário acessível no Caixa | `doctors.test.ts` | médico opcional preservado | Atendido |
| POS-09 | Conta | `company_account_id` | Caixa receptor | `finance.test.ts` | segregação por CNPJ | Atendido |
| POS-10 | Comprovante | resposta da venda | confirmação operacional | `sales.test.ts` | venda identificável | Atendido |
| POS-11 | Mesma transação no prontuário | ledger de venda único | prontuário global | `finance-pos-ledger.test.ts` | sem duplicação de fonte | Atendido |
| POS-12 | Impedir duplo clique | idempotência e guarda em voo | botão desabilitado/guardado | `original-plan-journeys` J2 | dois itens geram duas, não quatro requisições | Atendido |

## Financeiro

| REQ | Requisito | Backend | Frontend | Teste | Evidência | Estado |
|---|---|---|---|---|---|---|
| FIN-01 | Resumo | `/api/finance/summary` | KPIs | `finance-smoke.mjs` | saldo consolidado | Atendido |
| FIN-02 | Receitas | ledger por tipo | tabela de lançamentos | `finance.test.ts` | entradas realizadas | Atendido |
| FIN-03 | Despesas | ledger por tipo | tabela de lançamentos | `finance.test.ts` | saídas realizadas | Atendido |
| FIN-04 | Recebíveis | rota de recebíveis | tabela e baixa modal | `finance-pos-ledger.test.ts` | parcelas e liquidação | Atendido |
| FIN-05 | Realizado | datas de pagamento | filtro realizado | `finance-smoke.mjs` | regime realizado | Atendido |
| FIN-06 | CMV | snapshots na venda | KPIs financeiros | `finance-pos-ledger.test.ts` | custo histórico | Atendido |
| FIN-07 | Margem | cálculo em centavos | KPI de margem | `finance-pos-ledger.test.ts` | receita menos CMV | Atendido |
| FIN-08 | Visão por conta | filtro de conta | cards por CNPJ | `finance-smoke.mjs` | segregação de saldo | Atendido |
| FIN-09 | Filtros coerentes | query validada | `FilterBar` financeiro | `finance.test.ts` | período, tipo e conta | Atendido |
| FIN-10 | Paginação | limite/offset com teto | navegação anterior/próxima | `original-plan-journeys` J4 | contrato e controles paginados | Atendido |
| FIN-11 | CSV seguro | exportador neutraliza fórmula | ação de exportação | `csv-fixtures.test.ts`, jornada J4 | células perigosas protegidas | Atendido |
| FIN-12 | Impressão | CSS de impressão | ação de impressão | `original-plan-journeys` J4 | relatório formatado | Atendido |
| FIN-13 | Estorno compensatório | entrada reversa append-only | modal de estorno | `finance-pos-ledger.test.ts` | original preservado | Atendido |
| FIN-14 | Paciente clicável | `patient_id` nos recebíveis | `PatientLink` | `ui-system.test.ts` | tabela e modal | Atendido |

## Demo

| REQ | Requisito | Backend | Frontend | Teste | Evidência | Estado |
|---|---|---|---|---|---|---|
| DEM-01 | Banco povoado | seed demo idempotente | perfis e dados visíveis | `demo-environment.test.ts` | seed executado duas vezes no gate | Atendido |
| DEM-02 | Dados sintéticos | fixtures `.invalid` | aviso explícito | `demo-environment.test.ts` | sem identificador real | Atendido |
| DEM-03 | Ambiente isolado | `APP_ENV=demo` e banco próprio | configuração recebida da API | `attachment-environment-boundary.test.ts` | produção recusa demo | Atendido |
| DEM-04 | Sem credencial no frontend | sessão por papel no servidor | botões sem senha | `demo-environment.test.ts` | probe de fonte e bundle | Atendido |
| DEM-05 | Banner | `/api/config` | `demo-banner` | `accessibility.spec.ts` | ambiente identificado | Atendido |
| DEM-06 | Reset seguro | token, confirmação e alvo | sem reset público | gate `demo:reset` | reset duplo controlado | Atendido |

## Frontend

| REQ | Requisito | Backend | Frontend | Teste | Evidência | Estado |
|---|---|---|---|---|---|---|
| UI-01 | Azul clínico | configuração neutra | tokens `--color-*` | `ui-system.test.ts` | fonte única de tokens | Atendido |
| UI-02 | Modais | contratos de ação | `Modal`/`FormModal`/`ConfirmModal` | `accessibility.spec.ts` | trap, Escape e retorno | Atendido |
| UI-03 | Botões consistentes | estados de requisição | `Button`/`IconButton` | `ui-system.test.ts` | componentes compartilhados | Atendido |
| UI-04 | Loading | respostas assíncronas | `LoadingState`/`Skeleton` | `ui-system.test.ts` | estado anunciado | Atendido |
| UI-05 | Erro | Problem Details | `ErrorState` e alerts | `http-contracts.test.ts` | erro associado ao fluxo | Atendido |
| UI-06 | Vazio | listas vazias | `EmptyState` | `ui-system.test.ts` | mensagem uniforme | Atendido |
| UI-07 | Responsividade | contratos invariantes | shell e tabelas responsivas | `visual-baseline.spec.ts` | 360, 768 e 1440 | Atendido |
| UI-08 | Acessibilidade | respostas semânticas | foco, labels e movimento reduzido | `accessibility.spec.ts` | axe sem crítico/sério | Atendido |

## Resultado

Requisitos atendidos: **71 de 71**. Estados não aceitos: **0**. As correções encontradas durante o aceite foram a guarda síncrona contra duplo envio no Caixa e o roteamento real das páginas médicas para agenda/prontuários autorizados.
