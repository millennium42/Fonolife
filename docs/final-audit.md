# Auditoria final de release — PR 20 lógico

Data: 2026-07-25  
Base auditada: `bdbab0adf9dc8050c5f400b17a732138fa4d4ec3`  
Método de entrega: commits sequenciais diretamente na `main`, conforme decisão do proprietário.

## Resultado

P0 aberto: **0**  
P1 aberto: **0**  
P2 aberto: **0**

## Achados

| ID | Severidade | Evidência | Impacto | Arquivo | Correção | Teste | Estado |
|---|---|---|---|---|---|---|---|
| FNL-20-001 | P1 | Retry consultava somente `client_request_id` | Mesma chave podia confirmar um payload econômico diferente | `src/modules/finance/routes.ts`, `src/modules/catalog/routes.ts` | Fingerprint SHA-256 persistido e conflito `409` para payload divergente | `tests/idempotency.test.ts`, `tests/release-concurrency-smoke.mjs`, `tests/finance-smoke.mjs` | Corrigido |
| FNL-20-002 | P1 | Gate iniciava uma única aplicação | Corridas entre processos não eram comprovadas | `scripts/ci-check.sh` | Segunda instância com porta efêmera e PostgreSQL compartilhado | `tests/release-concurrency-smoke.mjs` | Corrigido |
| FNL-20-003 | P1 | Estorno não tratava retry, chave inválida nem corrida | Retry podia resultar em erro interno ou ambiguidade | `src/modules/finance/routes.ts` | Validação, fingerprint, retry e resolução de unique violation | `tests/finance-smoke.mjs` | Corrigido |
| FNL-20-004 | P2 | Marca do login era um `div` | Hierarquia semântica incompleta para tecnologia assistiva | `web/src/main.tsx` | Marca promovida a `h1` | `tests/e2e/accessibility.spec.ts` | Corrigido |
| FNL-20-005 | P2 | Matriz não exercitava zoom de 200% | Reflow e foco ampliados não tinham prova | `tests/e2e/accessibility.spec.ts` | Cenário desktop com zoom, teclado, navegação e conteúdo | Playwright `desktop-1440` | Corrigido |
| FNL-20-006 | P2 | Segunda instância usava inicialmente porta fixa | Gate podia colidir com serviço local | `scripts/ci-check.sh` | Porta publicada dinamicamente e descoberta via Docker | `npm run ci:check:full` | Corrigido |
| FNL-20-007 | P2 | Run remoto `30183577039` alertou actions internas baseadas em Node 20 | Depreciação futura do runner | `.github/workflows/ci.yml` | Checkout/setup atualizados para v6 e actions Docker para v4/v7 | CI remota final | Corrigido |

## Revisão por área

| Área | Evidência principal | Veredito |
|---|---|---|
| Segurança | `tests/devsec-smoke.mjs`, `tests/security-object-lgpd.test.ts`, `npm audit --audit-level=high` | Aprovado |
| Autenticação | sessões PostgreSQL, rate limit distribuído e concorrência de login no smoke de release | Aprovado |
| Autorização por objeto | `loadAndAuthorizePatient` e matriz Admin/Operador/Médico vinculado/não vinculado | Aprovado |
| LGPD | exportação, anonimização, auditoria imutável e testes de objeto | Aprovado |
| Anexos | storage privado, assinatura, scanner, quarentena, compensação e reconciliação | Aprovado |
| Banco | PostgreSQL 18 real, constraints, triggers append-only e health degradável | Aprovado |
| Migrations | banco vazio, upgrade 001–021 para 022 e execução repetida | Aprovado |
| Concorrência | duas instâncias; login, estoque, venda e baixa simultâneos | Aprovado |
| Idempotência | venda, estoque, lançamento, baixa e estorno; retry e payload divergente | Aprovado |
| Estoque | locks determinísticos e prova de uma única movimentação por chave | Aprovado |
| Vendas | transação atômica, parcelas, CMV histórico e baixa de insumos | Aprovado |
| POS | guarda contra duplo clique e jornada E2E do Caixa | Aprovado |
| Financeiro | ledger append-only, estorno compensatório, RBAC, paginação e CSV seguro | Aprovado |
| Frontend | design system compartilhado e jornadas nos três viewports | Aprovado |
| Acessibilidade | axe, teclado, foco de modal, reflow e zoom 200% | Aprovado |
| Demo | `APP_ENV=demo`, banco separado, reset seguro e ausência de credenciais no bundle | Aprovado |
| Deploy | manifests separados para produção/demo e build Docker de produção | Aprovado para entrega; publicação externa não foi executada |
| CI | fonte única `ci:check:full`, Node 24 e artefatos de Playwright | Aprovado |
| Documentação | aceite 71/71, 5W2H, auditoria e runbook final | Aprovado |
| Git/governança | `main` direta por decisão do proprietário; gates antes do push e CI depois do push | Aprovado |

## Matriz executada

- PostgreSQL vazio e banco de upgrade com migrations 001–021;
- migrations atuais duas vezes e migration 022 duas vezes no banco de upgrade;
- seed de teste duas vezes, seed demo duas vezes, reset demo duas vezes e recusa explícita em produção;
- duas aplicações simultâneas no mesmo banco;
- concorrência em login, venda, estoque e baixa;
- retry idempotente e mesma chave com payload diferente em todos os ledgers que aceitam chave;
- storage, scanner e banco indisponíveis pelas suítes de fronteira e compensação;
- 360×800, 768×1024, 1440×900, zoom 200%, axe e teclado;
- CSP, CSRF, RBAC, IDOR/BOLA, CSV e fórmula CSV;
- centavos `Number.isSafeInteger`, anonimização e downloads autorizado/quarentenado.

## Limites honestos

O gate comprova o artefato local, a imagem Docker e a CI, mas não equivale a publicação em produção. O Graphify atualizou 108 arquivos e reportou apenas a limitação conhecida de parser para `scripts/ci-check.ps1`; o script Bash é a fonte de verdade e o espelho PowerShell é coberto pelos testes de governança.
