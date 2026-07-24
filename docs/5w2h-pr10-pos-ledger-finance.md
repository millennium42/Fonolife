# 5W2H — PR 10: Unificar Caixa (PDV), Ledger e Financeiro

## Contexto

Esta entrega (PROMPT 06) consolida o ecossistema financeiro do Fonolife, unificando a frente de Caixa (PDV Rápido), parcelamento com validação matemática exata, ledger append-only (`financial_entries`), baixas idempotentes de parcelas com seleção de conta/meio de pagamento, estornos compensatórios com justificativa auditada e relatórios gerenciais/DRE.

---

## Estrutura 5W2H

### 1. What (O que foi feito?)
- **Banco de Dados & Idempotência**: Migration `migrations/018_finance_enhancements.sql` adicionando `version` em `sales` e `client_request_id` com índice único parcial em `financial_entries`.
- **Ledger Imutável & Estornos**: Preservação estrita das regras PostgreSQL que proíbem `UPDATE`/`DELETE` em `financial_entries` e `receivable_installments`. Criação dos endpoints `POST /api/finance/entries/:id/reverse` e `POST /api/finance/receivables/:id/settle` com suporte a justificativa e idempotência.
- **PDV (Caixa Rápido)**: Terminal de vendas integrado no balcão permitindo seleção rápida de paciente, itens do catálogo de produtos/serviços, forma de recebimento à vista ou parcelada e emissão direta por conta jurídica.
- **Frontend & Modais**:
  - Resumo de indicadores financeiros (Saldo Consolidado, Receitas do Mês, Despesas do Mês, Saldo do Mês, Faturamento por Categoria).
  - Sub-abas: **Lançamentos Realizados** (ledger), **Previsão de Parcelas a Receber** (carnês e vencimentos).
  - Modais: `SettleModal` (baixa de parcela com data e conta receptoras) e `ReversalModal` (estorno compensatório imutável com justificativa mínima de 3 caracteres).

### 2. Why (Por que foi feito?)
- Proporcionar transparência, rastreabilidade fiscal/financeira e prevenção de divergências de caixa, auditando cada transação física ou digital da clínica fonoaudiológica.

### 3. Where (Onde foi aplicado?)
- `migrations/018_finance_enhancements.sql`
- `src/domain/finance.ts`
- `src/domain/sales.ts`
- `src/modules/finance/routes.ts`
- `web/src/main.tsx`
- `tests/finance-pos-ledger.test.ts`
- `docs/5w2h-pr10-pos-ledger-finance.md`
- `docs/ciclo-financeiro.md`

### 4. When (Quando foi executado?)
- No fluxo sequencial do Fonolife (PROMPT 06), após a conclusão da PR 09.

### 5. Who (Quem participou?)
- Agente de IA e equipe de engenharia.

### 6. How (Como foi implementado?)
- Criação da branch isolada `codex/pr-10-pos-ledger-finance` a partir da `main`.
- Execução em 7 commits granulares.
- Validação contínua com `rtk npm run typecheck`, `rtk npm test`, `rtk npm run build` e `rtk npm audit --audit-level=high`.

### 7. How Much (Quanto custou/impacto?)
- Zero alteração destrutiva ou perda de histórico prévio.
- Histórico auditado 100% append-only.

---

## Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Tentativa de alteração destrutiva em lançamento prévio | Baixa | Alto | Trigger PostgreSQL `reject_financial_changes` impede `UPDATE`/`DELETE` em `financial_entries`. |
| Duplicidade na baixa de parcela em retries de rede | Média | Médio | Chave `client_request_id` e índice único em `financial_entries`. |
| Parcelamento divergente da soma total negociada | Baixa | Alto | Trigger de restrição `receivable_installments_total` no banco e validação no domínio. |

---

## Evidências de Validação

- `rtk npm run typecheck`: OK (0 erros de compilação).
- `rtk npm test`: OK (87 testes aprovados, incluindo ledger e finanças).
- `rtk npm run build`: OK (bundle de servidor e web cliente compilados).
- `rtk npm audit --audit-level=high`: OK (0 vulnerabilidades).
- `rtk git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`: OK.

---

## Plano de Rollback

Em caso de inconsistência pós-merge:
1. Reverter o merge da PR na `main`: `rtk git revert -m 1 <sha-do-merge>`.
2. Validar a execução da suíte de testes de regressão.
