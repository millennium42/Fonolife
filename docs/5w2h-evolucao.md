# 5W2H da evolução

## PR 1 — Base da clínica

- **What:** monólito executável, Docker, migração, autenticação, usuários, caixas e interface inicial.
- **Why:** oferecer fundação segura para os fluxos operacionais seguintes.
- **Where:** API, banco, frontend, testes, CI e documentação.
- **When:** primeira entrega, antes de CRM e financeiro.
- **Who:** admin configura; operador autentica e acessa o produto.
- **How:** Node/Fastify/React/PostgreSQL, SQL direto e Docker Compose.
- **How much:** baixo impacto operacional nesta fase; adiciona uma aplicação e um banco, sem custo financeiro estimado.

## PR 2 — CRM de pacientes

- **What:** cadastro rápido, busca, filtros, ficha, arquivamento e timeline imutável.
- **Why:** centralizar o histórico sem apagar ou sobrescrever informações.
- **Where:** domínio, migration 002, API, área Pacientes, testes e documentação.
- **When:** após a base autenticada e antes das tarefas de acompanhamento.
- **Who:** Admin e Operador registram e acompanham pacientes.
- **How:** SQL com constraints, optimistic locking e formulários progressivos.
- **How much:** impacto técnico moderado e redução operacional de retrabalho; sem custo financeiro estimado.

## PR 3 — Pós-atendimento

- **What:** tarefas, filas de hoje/atrasados/próximos, adaptação e sem contato.
- **Why:** tornar o cuidado após o atendimento visível e acionável.
- **Where:** ficha, Acompanhamento, API, domínio, banco e timeline.
- **When:** após CRM e antes da automação gerada por vendas.
- **Who:** Admin e Operador agendam e encerram retornos.
- **How:** estado histórico, datas de São Paulo e próxima ação derivada.
- **How much:** impacto positivo na fila diária; sem custo financeiro estimado.
# PR 4 — vendas de aparelhos

- What: venda na ficha, parcelas, recebimentos, entrega, garantia, cancelamento e follow-ups automáticos.
- Why: concluir a venda sem romper o fluxo único do paciente e preservar consistência financeira.
- Where: domínio, PostgreSQL, API, ficha do paciente, testes e documentação.
- When: quarta entrega incremental.
- Who: Admin e Operador autenticados.
- How: transação idempotente, constraints e lançamentos compensatórios.
- How much: uma migration, um módulo de domínio e extensões diretas na API/UI; impacto operacional reduzido ao fluxo já conhecido.

## PR 5 — Financeiro com dois CNPJs

- **What:** lançamento único, baixas, estornos, realizado, previsões e visões por caixa.
- **Why:** separar os CNPJs sem duplicar o fluxo de trabalho.
- **Where:** Financeiro, API, domínio, banco, testes e documentação.
- **When:** após vendas criarem o ledger inicial.
- **Who:** Operador lança/baixa; Admin vê saldos, relatórios e estorna.
- **How:** ledger append-only, compensação e filtros parametrizados.
- **How much:** impacto alto na integridade e simplificação operacional; sem custo financeiro estimado.

## PR 6 — Dashboard operacional

- **What:** indicadores operacionais, fila acionável e resumo financeiro realizado exclusivo do Admin.
- **Why:** colocar atrasos e retornos do dia na primeira tela, reduzindo contatos esquecidos.
- **Where:** endpoint `/api/dashboard`, tela Início, testes e documentação.
- **When:** após CRM, acompanhamento, vendas e financeiro fornecerem dados reais.
- **Who:** Admin e Operador veem operação; somente Admin vê valores agregados.
- **How:** consultas SQL diretas, cards compactos e links para ficha ou Acompanhamento.
- **How much:** uma rota e uma tela sem migration ou dependência; impacto operacional imediato e baixo impacto técnico.

## PR 7 — QA, documentação e release

- **What:** regressão P0/P1, acessibilidade, Playwright/axe, CI, Docker, documentação e evidências finais.
- **Why:** tornar a release reproduzível e impedir regressões nos fluxos críticos.
- **Where:** frontend, testes E2E, workflow, operação e documentação viva.
- **When:** após as seis entregas funcionais e antes da publicação da imagem.
- **Who:** equipe técnica valida; Admin e Operador executam as jornadas cobertas.
- **How:** três viewports, Compose real, seed/migrations repetidos, smoke API, axe e artefatos.
- **How much:** duas dependências exclusivas de desenvolvimento e maior tempo de CI; sem impacto no contêiner de produção nem custo financeiro inventado.
