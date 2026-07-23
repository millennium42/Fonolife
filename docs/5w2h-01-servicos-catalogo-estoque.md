# Documentação 5W2H — Entrega 1: Serviços, Catálogo & Estoque

## 1. Matriz 5W2H
- **What (O que):** Implementação de migração de banco de dados para serviços e produtos com CMV (Custo da Mercadoria Vendida), tempo de execução, tabela de relacionamento de produtos por serviço, regras de validação de domínio, endpoints de API REST no Fastify e suíte de testes.
- **Why (Por que):** Atender os requisitos de catálogo completo de produtos e serviços para clínicas fonoaudiológicas com métricas financeiras precisas (CMV e durabilidade de atendimento).
- **Where (Onde):** `migrations/012_services_and_inventory.sql`, `src/domain/services.ts`, `src/domain/inventory.ts`, `src/app.ts` e `tests/services.test.ts`.
- **When (Quando):** Ciclo da PR 1 da entrega Fonolife.
- **Who (Quem):** Equipe de desenvolvimento de agente de IA (Antigravity).
- **How (Como):** Migrações idempotentes no PostgreSQL, validações de domínio em TypeScript com centavos inteiros (`price_cents`, `cmv_cents`), integridade referencial com `service_products` e endpoints Fastify autenticados.
- **How Much (Quanto Custa):** Zero adicionais; monolito modular com drivers nativos.

## 2. Testes & Cobertura
- `tests/services.test.ts`: validações de nome, CMV, centavos inteiros e tempo de execução.
- `npm run typecheck` e `npm test` validados com sucesso.

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Serviço tentar consumir produtos inexistentes ou com quantidade zero.
  - *Contramedida:* Restrição `CHECK (quantity > 0)` na migration e transação ACID com validação de domínio.
- **Risco:** Estorno/modificação indevida em movimentações de estoque.
  - *Contramedida:* Trigger PostgreSQL imutável em `inventory_movements`.

## 4. Plano de Rollback
- Em caso de falha no deploy, executar o rollback da transação de migração e reverter o commit da branch `codex/01-servicos-catalogo-estoque`.
