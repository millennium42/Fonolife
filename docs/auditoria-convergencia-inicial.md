# Auditoria de convergência inicial

Base verificada em 2026-07-25: `main` local e `origin/main` em `0e6a80d2e2c022197c6c46db6ec597e04173e476`.

“PR” identifica um marco lógico. Nenhum item abaixo é considerado resolvido antes de seus commits chegarem à `main` com os gates aplicáveis verdes.

| ID | Severidade | Área | Evidência | Arquivo | Correção prevista | PR |
|---|---|---|---|---|---|---|
| CV-001 | P1 | Runtime | CI fixava Node 20, Docker usava Node 24 e o pacote aceitava 20+ | `.github/workflows/ci.yml`, `Dockerfile`, `package.json` | Fixar Node 24 e documentar a decisão | 16 |
| CV-002 | P2 | Higiene | Manifest e hook continham caminhos pessoais absolutos | `.graphify/manifest.json`, `.codex/hooks.json` | Parar de versionar estado local e validar arquivos rastreados | 16 |
| CV-003 | P1 | CI | O script local não executava Docker, migrations, seed, smoke ou Playwright | `scripts/ci-check.sh`, `scripts/ci-check.ps1` | Criar modos rápido e completo equivalentes à CI | 16 |
| CV-004 | P1 | Governança | O plano usava “PR” para agrupar entregas, mas o proprietário determinou commits sequenciais na `main` | orientação do proprietário; histórico Git | Tratar PR 16–20 como marcos lógicos e registrar gates por commit | 16 |
| CV-005 | P1 | Proteção | A proteção que exigia PR contrariava o fluxo definido pelo proprietário | proteção da branch `main` no GitHub | Remover a exigência de PR; exigir gate local antes e `validate` remoto após cada push | 16 |
| CV-006 | P0 | Demo | Corrigido: probe em `web`, `src` e bundle não encontra as credenciais conhecidas; login demo é sessão server-side | `src/config.ts`, `src/db/seeds/`, `src/modules/auth/routes.ts`, `web/src/main.tsx` | `APP_ENV`, bancos/seeds separados, reset controlado e rota exclusiva de demo | 17 |
| CV-007 | P2 | Frontend | Corrigido: tokens e componentes compartilhados, `PatientLink`, testes acessíveis e nove baselines inspecionados | `web/src/components/ui.tsx`, `tests/e2e/visual-baseline.spec.ts`, `docs/design-system.md` | Resolvido | 18 |
| CV-008 | P1 | Produto | Jornadas originais ainda não possuem uma matriz final única de aceitação | `tests/e2e/`, `docs/relatorio-validacao.md` | Executar matriz funcional e corrigir somente lacunas reais | 19 |
| CV-009 | P1 | Release | Não há auditoria final sobre a `main` resultante dos marcos 16–19 | inexistente | Executar auditoria final, CI remota e smoke no SHA publicado | 20 |
