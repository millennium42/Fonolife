# Documentação 5W2H — Entrega 4: Povoamento do Banco de Dados para Demonstração em Deploy

## 1. Matriz 5W2H
- **What (O que):** Atualização do script de povoamento (`src/db/seed.ts`) com dados realistas de médicos fonoaudiólogos, caixas/empresas, catálogo de aparelhos e serviços com CMV, estoque inicial, pacientes em diferentes etapas da jornada, vendas e movimentações.
- **Why (Por que):** Deixar a aplicação pronta para apresentação e demonstração em ambiente de deploy com dados ricos e consistentes.
- **Where (Onde):** `src/db/seed.ts`.
- **When (Quando):** Ciclo da PR 4 da entrega Fonolife.
- **Who (Quem):** Equipe de desenvolvimento de agente de IA (Antigravity).
- **How (Como):** Script idempotente em TypeScript com comandos PostgreSQL `ON CONFLICT DO UPDATE/NOTHING`, senhas criptografadas por `scrypt` e centavos inteiros.
- **How Much (Quanto Custa):** Zero custos adicionais.

## 2. Testes & Cobertura
- `npm run typecheck` e `npm test` validados com sucesso.
- Execução do script de seed com criação de usuários admin, médicos e operador.

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Execução do seed sobrescrever dados em produção.
  - *Contramedida:* Proteção `ON CONFLICT DO NOTHING` e validação do ambiente de demonstração.

## 4. Plano de Rollback
- Reverter o commit da branch `codex/04-design-system-seed-demo`.
