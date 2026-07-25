# Auditoria de convergência inicial

Base verificada em 2026-07-25: `main` local e `origin/main` em `0e6a80d2e2c022197c6c46db6ec597e04173e476`.

Nenhum item abaixo é considerado resolvido antes do merge da PR correspondente.

| ID | Severidade | Área | Evidência | Arquivo | Correção prevista | PR |
|---|---|---|---|---|---|---|
| CV-001 | P1 | Runtime | CI fixava Node 20, Docker usava Node 24 e o pacote aceitava 20+ | `.github/workflows/ci.yml`, `Dockerfile`, `package.json` | Fixar Node 24 e documentar a decisão | 16 |
| CV-002 | P2 | Higiene | Manifest e hook continham caminhos pessoais absolutos | `.graphify/manifest.json`, `.codex/hooks.json` | Parar de versionar estado local e validar arquivos rastreados | 16 |
| CV-003 | P1 | CI | O script local não executava Docker, migrations, seed, smoke ou Playwright | `scripts/ci-check.sh`, `scripts/ci-check.ps1` | Criar modos rápido e completo equivalentes à CI | 16 |
| CV-004 | P1 | Governança | Commits posteriores à PR 8 chegaram à `main` sem PRs correspondentes no GitHub | histórico Git; GitHub PRs 1–8 | Restaurar PRs reais daqui em diante e registrar a lacuna histórica sem fabricar PRs | 16 |
| CV-005 | P1 | Proteção | Consulta inicial retornou `Branch not protected`; a API passou a confirmar `validate` estrito, uma aprovação e bloqueios de force push/exclusão | proteção da branch `main` no GitHub | Configuração aplicada; fechamento documental após merge | 16 |
| CV-006 | P0 | Demo | Credenciais conhecidas aparecem no frontend e no seed | `web/src/main.tsx`, `src/db/seed.ts` | Separar ambientes/seeds e remover credenciais do bundle | 17 |
| CV-007 | P2 | Frontend | Design system ainda precisa de prova transversal e acessibilidade | `web/src/main.tsx`, `web/src/style.css` | Consolidar tokens/componentes e baseline visual | 18 |
| CV-008 | P1 | Produto | Jornadas originais ainda não possuem uma matriz final única de aceitação | `tests/e2e/`, `docs/relatorio-validacao.md` | Executar matriz funcional e corrigir somente lacunas reais | 19 |
| CV-009 | P1 | Release | Não há auditoria independente sobre a `main` resultante das PRs 16–19 | inexistente | Executar auditoria final, CI remota e smoke pós-merge | 20 |
