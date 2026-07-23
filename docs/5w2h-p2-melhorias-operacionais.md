# Documentação 5W2H — Entrega: Melhorias Operacionais e Qualidade P2

## 1. Matriz 5W2H
- **What (O que):** Implementação das melhorias de prioridade P2:
  1. Suporte a paginação em lista de pacientes e lançamentos por limite/cursor.
  2. Suporte a testes visuais e responsivos no Playwright (breakpoints 360px, 768px e 1440px).
  3. Refatoração e separação do seed (`src/db/seed.ts` e fixtures isoladas).
  4. Documentação de retenção/descarte de anexos e ADRs.
- **Why (Por que):** Evitar degradação de performance ao listar centenas de pacientes/lançamentos, evitar quebra de layout mobile/desktop e garantir isolamento entre dados de teste e dados de demonstração.
- **Where (Onde):** `src/app.ts`, `src/db/seed.ts`, `playwright.config.ts`, `tests/e2e/` e `docs/`.
- **When (Quando):** Ciclo da entrega `codex/p2-melhorias-operacionais`.
- **Who (Quem):** Equipe Antigravity.
- **How (Como):** Parâmetros de consulta `limit` e `before` para paginação SQL previsível, fixtures isoladas no seed e testes E2E com Playwright.
- **How Much (Quanto Custa):** Zero custo adicional; infraestrutura existente mantida.

## 2. Testes & Cobertura
- `npm run typecheck`
- `npm test`
- `playwright` / e2e testes responsivos.

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Paginação por OFFSET causar lentidão em tabelas volumosas.
  - *Contramedida:* Uso de índices ordenados e paginação por limite/cursor de id ou data.

## 4. Plano de Rollback
- Reverter commit da branch `codex/p2-melhorias-operacionais`.
