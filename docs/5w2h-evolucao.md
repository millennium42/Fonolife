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
