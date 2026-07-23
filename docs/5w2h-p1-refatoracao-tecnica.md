# Documentação 5W2H — Entrega: Refatoração Técnica e Confiabilidade P1

## 1. Matriz 5W2H
- **What (O que):** Implementação das correções de prioridade P1:
  1. Armazenamento de anexos por streaming com validação de magic bytes (`src/domain/attachments.ts`).
  2. Validação estrita de entrada via Fastify Schemas / TypeBox e formato Problem Details (RFC 7807) para mapeamento de FK/Check/Unique constraints.
  3. Garantia de precisão financeira em centavos inteiros nos codecs da API.
  4. Concorrência e idempotência em financeiro e estoque (`SELECT ... FOR UPDATE`, constraints de unicidade vinculadas a `sale_id`/`service_execution_id`).
  5. Parser CSV RFC 4180 completo para importações sem quebras com campos multilinha entre aspas.
  6. Rate Limiting com expiração e mecanismo de revogação de sessões após troca de senha.
- **Why (Por que):** Evitar travamento do event loop em uploads grandes, arquivos corrompidos/maliciosos, inconsistência em requisições simultâneas de vendas/estoque, falha ao importar planilhas reais e rate limit volátil em memória.
- **Where (Onde):** `src/domain/attachments.ts`, `src/domain/csv-import.ts`, `src/domain/finance.ts`, `src/domain/inventory.ts`, `src/domain/sales.ts`, `src/app.ts`, `src/modules/` e suíte de testes.
- **When (Quando):** Ciclo da entrega `codex/p1-refatoracao-tecnica`.
- **Who (Quem):** Equipe Antigravity.
- **How (Como):** Streaming de I/O em arquivos, bloqueio `FOR UPDATE` em transações SQL, parser RFC 4180 robusto e mapeamento previsível de erros Problem Details.
- **How Much (Quanto Custa):** Zero adicionais; monolito TypeScript mantido.

## 2. Testes & Cobertura
- `npm run typecheck`
- `npm test` (incluindo testes de streaming/magic bytes, parser CSV RFC 4180 e concorrência)
- `docker compose up --build --wait` & `npm run test:e2e`

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Uploads concorrentes ou interrupção de streaming deixarem arquivos órfãos no sistema.
  - *Contramedida:* Escrita em local temporário com rotação e remoção no bloco `catch`/`finally` em caso de erro na transação.
- **Risco:** Concorrência em baixa de parcela financeira duplicar lançamentos.
  - *Contramedida:* `SELECT ... FOR UPDATE` no registro da parcela e chave idempotente única por transação.

## 4. Plano de Rollback
- Reverter commit da branch `codex/p1-refatoracao-tecnica`.
