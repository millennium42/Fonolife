# 5W2H — PR 13: Consolidar Esteira de CI/CD e Auditoria Contínua

> Registro histórico. A política de Node 20+ e os seis gates locais desta entrega foram substituídos pela ADR 001 e pela PR 16.

## Contexto

Esta entrega (PROMPT 09) consolida a esteira de Integração Contínua (CI/CD) do Fonolife, adicionando validação de extração AST do Graphify (`graphify update .`), scripts de checagem local pre-commit/pre-push (`scripts/ci-check.sh` e `scripts/ci-check.ps1`), testes de integridade da esteira e atualização da documentação de proteção da branch `main`.

---

## Estrutura 5W2H

### 1. What (O que foi feito?)
- **Workflow do GitHub Actions**: Atualização do `.github/workflows/ci.yml` com suporte ao Node.js 20+ e inclusão da etapa `npx graphify update .`.
- **Scripts de Validação Local**:
  - `scripts/ci-check.sh`: Script Shell para execução local dos 6 gates de qualidade em ambientes Linux/macOS/Git Bash.
  - `scripts/ci-check.ps1`: Script PowerShell com a mesma sequência de gates para ambientes Windows.
  - Atalho npm `"ci:check": "bash scripts/ci-check.sh"` no `package.json`.
- **Testes de Integridade da Esteira**: `tests/ci-integrity.test.ts` cobrindo a existência e integridade dos scripts de CI e workflows.
- **Documentação de Proteção**: Atualização do guia `docs/ci-protection.md`.

### 2. Why (Por que foi feito?)
- Garantir que nenhum código entre na branch `main` sem passar por 100% de validação estrita (typecheck, testes, build, auditoria de segurança, formatação e integridade de AST).

### 3. Where (Onde foi aplicado?)
- `.github/workflows/ci.yml`
- `scripts/ci-check.sh`
- `scripts/ci-check.ps1`
- `package.json`
- `tests/ci-integrity.test.ts`
- `docs/ci-protection.md`
- `docs/5w2h-pr13-ci-cd-continuous-audit.md`

### 4. When (Quando foi executado?)
- No encerramento da suíte de entregas do Fonolife (PROMPT 09).

### 5. Who (Quem participou?)
- Agente de IA e equipe de engenharia.

### 6. How (Como foi implementado?)
- Branch `codex/pr-13-ci-cd-continuous-audit` criada a partir da `main`.
- Desenvolvido em 4 commits granulares.
- Validado com os scripts de CI locais em PowerShell e Bash.

### 7. How Much (Quanto custou/impacto?)
- Sem custos de infraestrutura adicional. Reduz drasticamente falhas em ambiente remoto ao permitir execução local idêntica antes do push.

---

## Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Merge de código com falha em testes ou typecheck | Baixa | Alto | Pipeline de CI do GitHub Actions bloqueia merges até que 100% dos jobs sejam verdes. |
| Inclusão de vulnerabilidades conhecidas em dependências | Baixa | Alto | Job `npm audit --audit-level=high` reprova o build caso existam vulnerabilidades altas/críticas. |
| Divergência na extração de AST do repositório | Baixa | Médio | Etapa `npx graphify update .` valida a integridade do mapa arquitetural a cada commit. |

---

## Evidências de Validação

- `rtk npm run typecheck`: OK (0 erros).
- `rtk npm test`: OK (90 testes aprovados).
- `rtk npm run build`: OK (bundle compilado).
- `rtk npm audit --audit-level=high`: OK (0 vulnerabilidades).
- `rtk powershell -ExecutionPolicy Bypass -File scripts/ci-check.ps1`: OK (todos os 6 gates locais aprovados).
- `rtk git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`: OK.
