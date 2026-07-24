# 5W2H — PR 07: Consolidar CI e Higiene do Graphify

## Contexto

Esta entrega (PROMPT 03) consolida as políticas de proteção de Integração Contínua (CI) e a higiene do controle de versão do repositório Fonolife, garantindo que caches voláteis e estados locais do Graphify não poluam diffs ou branches do Git, e que toda Pull Request execute um pipeline estrito de validação automatizada.

---

## Estrutura 5W2H

### 1. What (O que será feito?)
- Exclusão de arquivos de cache e instrução temporária do Graphify do controle de versão (`.graphify/cache/`, `.graphify/.graphify_describe_pending`, `.graphify/description-instructions/`, etc.).
- Atualização do `.gitignore` para bloquear o versionamento futuro de caches do Graphify.
- Endurecimento do workflow `.github/workflows/ci.yml` com concorrência (`cancel-in-progress`), timeouts de 20 minutos, verificação estrita de caracteres em branco (`diff --check`), validação de idempotência de migrations e seeds, testes E2E com Playwright + `@axe-core/playwright` e geração de artefatos de evidências.
- Documentação formal da política de CI e proteção da branch `main` em `docs/ci-protection.md`.

### 2. Why (Por que é necessário?)
- Caches do Graphify geravam milhares de alterações voláteis nos diffs de commits/PRs, dificultando revisões de código.
- Garantir que nenhuma alteração seja mesclada na `main` com erros de compilação, falhas de testes, vulnerabilidades de segurança de alto risco, regressões visuais, violações de acessibilidade ou falta de idempotência no banco de dados.

### 3. Where (Onde será aplicado?)
- `.gitignore`
- `.graphify/` (limpeza do índice Git via `git rm --cached`)
- `.github/workflows/ci.yml`
- `tests/e2e/accessibility.spec.ts`
- `docs/ci-protection.md`
- `docs/5w2h-pr07-ci-graphify-hygiene.md`

### 4. When (Quando será executado?)
- No fluxo sequencial de entregas Fonolife (PROMPT 03), imediatamente após o merge das correções de segurança P1 (PR 05) e fronteiras de anexos (PR 06).

### 5. Who (Quem participa?)
- Agente de IA (desenvolvimento e automação de testes) e usuário (revisão e aprovação).

### 6. How (Como será implementado?)
- Criação da branch isolada `codex/pr-07-ci-graphify-hygiene` a partir da `main`.
- Commits granulares por intenção (`chore(graphify)`, `ci`, `docs`).
- Validação local de todos os gates usando `rtk npm run typecheck`, `rtk npm test`, `rtk npm run build`, `rtk npm audit --audit-level=high` e `rtk proxy npm run test:e2e`.

### 7. How Much (Quanto custa/impacto?)
- Zero custo financeiro de infraestrutura.
- Redução expressiva no tamanho dos diffs do Git e eliminação do risco de mergess com falhas não detectadas.

---

## Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Perda inadvertida de documentação relevante do Graphify | Baixa | Médio | Manter `GRAPH_REPORT.md`, `manifest.json` e `graph.json` rastreados e seguros. |
| Pipeline de CI demorar excessivamente em PRs concorrentes | Média | Baixo | Adição da diretiva `concurrency` com `cancel-in-progress: true` para cancelar builds redundantes da mesma ref. |
| Falha silenciosa em migrations/seeds | Baixa | Alto | Execução dupla de `migrate.js` e `seed.js` no CI para comprovação empírica de idempotência. |

---

## Evidências de Teste e Validação

- `rtk git status --short`: sem caches do Graphify marcados como modified/untracked no Git.
- `rtk npm run typecheck`: OK (0 erros de compilação).
- `rtk npm test`: OK (todos os testes unitários e de integração aprovados).
- `rtk npm run build`: OK (bundle de servidor e cliente compilados com sucesso).
- `rtk npm audit --audit-level=high`: OK (0 vulnerabilidades de severidade alta/crítica).
- `rtk git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`: OK (0 erros de formatação/whitespace).

---

## Plano de Rollback

Caso ocorra qualquer problema pós-merge na `main`:
1. Reverter os commits da PR via `git revert -m 1 <sha-do-merge>`.
2. Restaurar a versão anterior de `.github/workflows/ci.yml`.
3. Notificar a equipe através do log de auditoria do GitHub Actions.
