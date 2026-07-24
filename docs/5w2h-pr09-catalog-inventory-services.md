# 5W2H — PR 09: Concluir Catálogo, Estoque, Serviços e CMV

## Contexto

Esta entrega (PROMPT 05) disponibiliza o módulo completo de **Estoque e Catálogo** do Fonolife, unificando a gestão transacional de aparelhos auditivos (produtos), SKU, estoque mínimo com alertas, serviços fonoaudiológicos com cálculo derivado de CMV (Custo das Mercadorias/Serviços Vendidos) e consumo de insumos, modais interativos de ajuste com justificativa obrigatória e histórico append-only auditado com salvaguardas de concorrência e idempotência.

---

## Estrutura 5W2H

### 1. What (O que foi feito?)
- **Modelagem & Banco de Dados**: Adição da migration idempotente `migrations/017_catalog_inventory_enhancements.sql` com campos `sku`, `min_stock` e `version` em `products`; `version` em `services`; e `client_request_id` com índice único em `inventory_movements`.
- **Regras de Negócio Backend**:
  - `src/domain/inventory.ts`: Validações de SKU, estoque mínimo e justificativa obrigatória em movimentações.
  - `src/domain/services.ts`: Cálculo derivado de CMV com base nos insumos do serviço e margem de lucro estimada.
  - `src/modules/catalog/routes.ts`: Suporte a travamento por lock `FOR UPDATE` do produto na movimentação de estoque, impedimento de saldo negativo (retornando erro 409), filtro de baixo estoque (`stock_balance <= min_stock`) e controle de concorrência otimista (`version`).
  - `src/modules/finance/routes.ts`: Baixa automática de estoque na venda de produtos/serviços e estorno compensatório em caso de cancelamento de venda.
- **Interface Web UI**:
  - Aba "Estoque & Catálogo" com cards resumo de totais e valor acumulado do estoque.
  - Sub-abas: **Produtos**, **Serviços**, **Baixo Estoque**, **Histórico de Movimentações**.
  - Modais interativos: Cadastro/Edição de produtos, Cadastro/Edição de serviços e Ajuste de estoque com justificativa obrigatória.
- **Suíte de Testes**: `tests/catalog-inventory.test.ts` validando SKU, estoque mínimo, justificativas e regras de CMV.

### 2. Why (Por que foi feito?)
- Fornecer à clínica controle rigoroso sobre insumos e produtos clínicos, evitando ruptura de estoque de aparelhos auditivos, garantindo clareza na margem financeira de cada procedimento fonoaudiológico e rastreabilidade total das movimentações física-financeiras.

### 3. Where (Onde foi aplicado?)
- `migrations/017_catalog_inventory_enhancements.sql`
- `src/domain/inventory.ts`
- `src/domain/services.ts`
- `src/modules/catalog/routes.ts`
- `src/modules/finance/routes.ts`
- `web/src/main.tsx`
- `web/src/style.css`
- `tests/catalog-inventory.test.ts`
- `docs/5w2h-pr09-catalog-inventory-services.md`
- `docs/manual-de-operacao.md`

### 4. When (Quando foi executado?)
- No fluxo sequencial do Fonolife (PROMPT 05), após a modularização da API na PR 08.

### 5. Who (Quem participou?)
- Agente de IA e equipe de engenharia.

### 6. How (Como foi implementado?)
- Criação da branch `codex/pr-09-catalog-inventory-services` a partir da `main`.
- Execução em 7 commits granulares.
- Validação contínua via `rtk npm run typecheck`, `rtk npm test`, `rtk npm run build` e `rtk npm audit --audit-level=high`.

### 7. How Much (Quanto custou/impacto?)
- Zero risco regressivo ou alteração destrutiva em tabelas existentes.
- Garantia de histórico imutável append-only no banco de dados PostgreSQL.

---

## Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Tentativa de ajuste levando saldo a valor negativo | Baixa | Alto | Verificação transacional no backend com rollback e resposta HTTP 409 Conflict. |
| Duplo clique em ajuste de estoque | Média | Médio | Chave de idempotência `client_request_id` e lock de linha `FOR UPDATE`. |
| Concorrência ao editar produto por múltiplos usuários | Baixa | Médio | Trava de otimização por versão (`version`). |

---

## Evidências de Validação

- `rtk npm run typecheck`: OK (0 erros).
- `rtk npm test`: OK (85 testes aprovados, incluindo catálogo e estoque).
- `rtk npm run build`: OK (Servidor e cliente React VITE).
- `rtk npm audit --audit-level=high`: OK (0 vulnerabilidades).
- `rtk git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`: OK.

---

## Plano de Rollback

Em caso de divergência operacional pós-merge:
1. Reverter o merge da PR na `main`: `rtk git revert -m 1 <sha-do-merge>`.
2. Rodar a suíte de testes de regressão na `main`.
