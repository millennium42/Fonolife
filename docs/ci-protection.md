# Proteção de CI e Gates de Qualidade — Fonolife

Este documento especifica os requisitos de Integração Contínua (CI), proteção da branch `main`, gestão de severidade de achados (P0/P1/P2) e política de higiene do repositório Fonolife.

---

## 1. Princípios Gerais

1. **Push Direto Proibido**: Toda alteração deve ser entregue via Pull Request (PR) criada a partir de uma branch dedicada nomeada `codex/<entrega>`.
2. **CI Obrigatória**: Nenhuma PR pode ser mesclada na branch `main` sem que todos os jobs do GitHub Actions tenham concluído com status verde (sucesso).
3. **Evidência Empírica**: Declarações de qualidade sem logs, relatórios de teste ou status de CI são inaceitáveis.

---

## 2. Gates Obrigatórios do Pipeline (GitHub Actions)

Cada execução do workflow de CI (`.github/workflows/ci.yml`) valida automaticamente os seguintes gates em ordem estrita:

| Ordem | Gate | Comando / Ação | Critério de Sucesso |
|---|---|---|---|
| 1 | **Formatação e Whitespace** | `git -c core.whitespace=... diff --check` | 0 erros de espaço em branco ou final de arquivo. |
| 2 | **Instalação Limpa** | `npm ci` | Instalação de dependências determinística via `package-lock.json`. |
| 3 | **Auditoria de Segurança** | `npm audit --audit-level=high` | 0 vulnerabilidades de nível alto ou crítico. |
| 4 | **Checagem de Tipos (TypeScript)** | `npm run typecheck` | 0 erros no servidor e no frontend web. |
| 5 | **Testes Unitários e HTTP** | `npm test` | 100% dos testes da suíte aprovados. |
| 6 | **Build de Produção** | `npm run build` | Bundle compilado sem erros. |
| 7 | **Infraestrutura PostgreSQL Real** | `docker compose up --build --wait` | Containers saudáveis no Docker. |
| 8 | **Idempotência de Migrations** | Execução dupla de `migrate.js` | 2ª execução completa de forma limpa sem tentar re-executar migrations já aplicadas. |
| 9 | **Idempotência do Seed** | Execução dupla de `seed.js` | 2ª execução completa sem duplicar registros ou violar constraints. |
| 10 | **Smoke Tests Operacionais** | `dashboard-smoke.mjs` e `finance-smoke.mjs` | Respostas HTTP 200 OK com payloads esperados. |
| 11 | **Imutabilidade Financeira** | Updates/Deletes simulados no PostgreSQL | Triggers de imutabilidade bloqueiam edições diretas na tabela `financial_entries`. |
| 12 | **E2E e Acessibilidade (WCAG 2.1 AA)** | `playwright test` (`@axe-core/playwright`) | Sem violações no Axe e sem overflow horizontal nos viewports 360x800, 768x1024 e 1440x900. |
| 13 | **DevSec Smoke** | `devsec-smoke.mjs` | Verificação de headers de segurança, rate limit e CSRF. |
| 14 | **Artefatos de QA** | Upload do relatório Playwright e screenshots | Artefatos salvos com retenção de 14 dias para inspeção visual em caso de falhas. |

---

## 3. Matriz de Severidade de Achados

Antes do merge de qualquer PR, a revisão de código e testes deve classificar todos os problemas encontrados conforme a seguinte matriz:

- **P0 — Crítico**: Vulnerabilidade de segurança explorável (ex: bypass de auth, IDOR, SQL injection, vazamento de PII), perda de dados clínicos/financeiros, ou indisponibilidade total do sistema.
  - *Critério de merge*: `P0 = 0` (Bloqueio absoluto).
- **P1 — Bloqueador**: Regra de negócio violada (ex: saldo negativo de estoque, baixa duplicada de insumos, fallback silencioso de rate limit), falha em teste unitário/E2E ou erro de compilação.
  - *Critério de merge*: `P1 = 0` (Bloqueio absoluto).
- **P2 — Melhoria Necessária**: Débito técnico menor, inconsistência estética secundária ou documentação incompleta.
  - *Critério de merge de PR intermediária*: Permitido se justificado e agendado para a release.
  - *Critério da Release Final*: `P2 = 0` (A release final exige zero P2).

---

## 4. Política de Higiene do Graphify

Para evitar a inclusão de milhares de linhas voláteis de cache nos diffs de Pull Requests:

1. **Ignorados no Git**: O arquivo `.gitignore` deve incluir expressamente as pastas e arquivos temporários do Graphify (`.graphify/cache/`, `.graphify/.graphify_describe_pending`, `.graphify/.graphify_detect.json`, `.graphify/.graphify_labels.json`, `.graphify/branch.json`, `.graphify/description-instructions/`, `.graphify/label-instructions/`, `.graphify/scope.json`, `.graphify/worktree.json`).
2. **Versionamento Estável**: Apenas arquivos estáveis e legíveis de documentação arquitetural do Graphify devem ser mantidos no Git (`.graphify/GRAPH_REPORT.md`, `.graphify/manifest.json`, `.graphify/graph.json`).
3. **Atualização**: Após alterações relevantes no código, execute `rtk graphify update .` e verifique com `rtk git status --short` para confirmar que nenhum arquivo de cache foi adicionado acidentalmente à staging area.

---

## 5. Procedimento de Rollback

Em caso de identificação de defeitos pós-merge em produção ou na branch `main`:

1. Executar o revert imediato via Git:
   ```bash
   rtk git switch main
   rtk git pull --ff-only
   rtk git revert -m 1 <COMMIT_SHA>
   rtk git push origin main
   ```
2. Confirmar a execução bem-sucedida do pipeline de CI pós-reversão.
3. Notificar a equipe e abrir uma nova branch `codex/` para investigar a causa raiz com `m1nd` e `graphify`.
