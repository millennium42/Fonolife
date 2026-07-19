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
