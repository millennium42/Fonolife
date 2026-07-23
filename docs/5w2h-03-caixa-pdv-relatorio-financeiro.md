# Documentação 5W2H — Entrega 3: Aba Caixa (PDV) & Relatório Financeiro Reformulado

## 1. Matriz 5W2H
- **What (O que):** Construção da aba "Caixa (PDV)" para operador com vendas diretas de produtos e serviços do catálogo, carrinho, formas de pagamento e recibo; reformulação visual do Relatório Financeiro com cards KPI, filtro por caixa/período e modal de estorno imutável; e componente global de Prontuário por clique no nome do paciente.
- **Why (Por que):** Oferecer uma experiência de PDV fluida para operadoras, simplificar a gestão de receitas/despesas para administradores e permitir navegação direta ao prontuário do paciente em qualquer ponto da aplicação.
- **Where (Onde):** `web/src/main.tsx` e `web/src/style.css`.
- **When (Quando):** Ciclo da PR 3 da entrega Fonolife.
- **Who (Quem):** Equipe de desenvolvimento de agente de IA (Antigravity).
- **How (Como):** Componentes React com estado centralizado (`PosCheckout`, `Finance`, `GlobalPatientModal`), integração com as APIs de vendas e produtos/serviços, estilização CSS com azul clínico.
- **How Much (Quanto Custa):** Zero custos adicionais.

## 2. Testes & Cobertura
- `npm run typecheck` e `npm test` validados com sucesso.
- Validação manual de renderização de componentes React e responsividade mobile.

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Tentativa de estorno manual alterar registro histórico direto no banco.
  - *Contramedida:* O backend executa o estorno criando um lançamento compensatório oposto (append-only), mantendo integridade contábil.

## 4. Plano de Rollback
- Reverter o commit da branch `codex/03-caixa-pdv-relatorio-financeiro`.
