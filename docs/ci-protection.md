# Proteção de CI e Gates de Qualidade — Fonolife

Este documento especifica os requisitos de Integração Contínua (CI), proteção da branch `main`, gestão de severidade de achados (P0/P1/P2) e política de higiene do repositório Fonolife.

---

## 1. Princípios Gerais

1. **Entrega sequencial na `main`**: Por decisão do proprietário em 2026-07-25, “PR 16–20” identifica marcos lógicos. Cada marco é composto por commits pequenos diretamente na `main`, somente depois dos gates locais aplicáveis.
2. **CI Obrigatória**: Todo push na `main` deve executar o workflow remoto. Um marco só avança após o check `validate` concluir com sucesso.
3. **Evidência Empírica**: Declarações de qualidade sem logs, relatórios de teste ou status de CI são inaceitáveis.

---

## 2. Gates obrigatórios do pipeline

O workflow roda em Pull Requests, em pushes da `main` e por `workflow_dispatch`. A validação usa Node.js 24 e chama `npm run ci:check:full`, a mesma fonte de verdade do gate local.

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

## 3. Scripts de validação local

O modo rápido cobre whitespace, higiene, runtime, typecheck, testes, build, audit e atualização AST do Graphify:

- **Linux / macOS / Git Bash**:
  ```bash
  npm run ci:check
  ```
- **Windows PowerShell**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/ci-check.ps1
  ```

O modo completo adiciona Docker, PostgreSQL, migrations e seed repetidos, health, smokes, Playwright e axe:

```bash
npm run ci:check:full
```

No PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/ci-check.ps1 -Full
```

---

## 4. Matriz de Severidade de Achados

Antes de concluir qualquer marco lógico, a revisão de código e testes deve classificar todos os problemas encontrados conforme a seguinte matriz:

- **P0 — Crítico**: Vulnerabilidade de segurança explorável (ex: bypass de auth, IDOR, SQL injection, vazamento de PII), perda de dados clínicos/financeiros, ou indisponibilidade total do sistema.
  - *Critério de avanço*: `P0 = 0` (Bloqueio absoluto).
- **P1 — Bloqueador**: Regra de negócio violada (ex: saldo negativo de estoque, baixa duplicada de insumos, fallback silencioso de rate limit), falha em teste unitário/E2E ou erro de compilação.
  - *Critério de avanço*: `P1 = 0` (Bloqueio absoluto).
- **P2 — Melhoria Necessária**: Débito técnico menor, inconsistência estética secundária ou documentação incompleta.
  - *Critério de marco intermediário*: Permitido se justificado e agendado para a release.
  - *Critério da Release Final*: `P2 = 0` (A release final exige zero P2).

---

## 5. Política de Higiene do Graphify

Para evitar a inclusão de milhares de linhas voláteis de cache nos diffs:

1. **Ignorados no Git**: O arquivo `.gitignore` deve incluir expressamente as pastas e arquivos temporários do Graphify (`.graphify/cache/`, `.graphify/.graphify_describe_pending`, `.graphify/.graphify_detect.json`, `.graphify/.graphify_labels.json`, `.graphify/branch.json`, `.graphify/description-instructions/`, `.graphify/label-instructions/`, `.graphify/scope.json`, `.graphify/worktree.json`).
2. **Estado local não versionado**: `.graphify/` e `graphify-out/` são regeneráveis e não entram no Git; isso elimina caminhos absolutos, timestamps e inventários de branches locais.
3. **Atualização**: Após alterações relevantes no código, execute `rtk graphify update .`. A CI repete a extração sobre o checkout atual e falha se o comando falhar.

## 6. Proteção da `main`

Estado em 2026-07-25: `DIRECT_MAIN_BY_OWNER`. A proteção que exigia Pull Request foi removida após a orientação explícita para commits diretos na `main`. A segurança do fluxo passa a depender dos gates locais antes do push, do check remoto `validate` após o push e da interrupção imediata do próximo marco se a CI falhar.

---

## 7. Procedimento de rollback

Em caso de identificação de defeitos após um push em produção ou na branch `main`:

1. Executar o revert imediato via Git:
   ```bash
   rtk git switch main
   rtk git pull --ff-only
   rtk git revert <COMMIT_SHA>
   rtk git push origin main
   ```
2. Confirmar a execução bem-sucedida do pipeline de CI pós-reversão.
3. Notificar a equipe e investigar a causa raiz com `m1nd` e `graphify` antes de novo commit.
