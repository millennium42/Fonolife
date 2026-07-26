# 5W2H — PR 20 lógico: auditoria e release final

- **What:** fechar a auditoria transversal, fortalecer idempotência e concorrência e publicar evidências reproduzíveis da release.
- **Why:** impedir confirmação ambígua de operações econômicas, comprovar operação com mais de uma instância e encerrar com P0/P1/P2 iguais a zero.
- **Where:** ledgers de vendas, estoque e financeiro; migration 022; CI; smokes; acessibilidade; documentação de release.
- **When:** último marco lógico após o aceite 71/71 do plano original.
- **Who:** manutenção do Fonolife; o proprietário definiu entrega por commits diretos na `main`.
- **How:** fingerprint SHA-256 do payload, constraints PostgreSQL, resolução de corrida por chave única, duas aplicações sobre o mesmo banco e gate completo.
- **How much:** sem dependência nova; uma migration aditiva, um helper de domínio, um smoke integrado e uma extensão do Playwright.

## Testes

`npm run ci:check:full` em Node 24: 108/108 testes, build, audit com zero vulnerabilidades, Graphify, PostgreSQL, upgrade de schema, seeds/reset repetidos, quatro smokes e Playwright com 18 aprovados e 12 skips intencionais de cenários desktop-only.

## Riscos e rollback

- Linhas anteriores à migration 022 não possuem fingerprint; reutilizar uma chave histórica resulta em `409`, escolha segura contra confirmação ambígua.
- A publicação externa não faz parte do gate local; o deploy deve usar o SHA de código registrado em `docs/release-final.md`.
- Para rollback, reverta os commits do marco. A migration 022 pode permanecer porque as colunas são opcionais e retrocompatíveis; não apague ledger financeiro, vendas ou movimentos de estoque.
