# Release final — Fonolife

## Identificação

- Data: 2026-07-25, America/Sao_Paulo.
- SHA inicial do programa: `0e6a80d2e2c022197c6c46db6ec597e04173e476`.
- SHA do código candidato: `bdbab0adf9dc8050c5f400b17a732138fa4d4ec3`.
- Marcos incluídos: PRs lógicos 16, 17, 18, 19 e 20.
- Modelo Git: commits diretos na `main`, por decisão explícita do proprietário; não houve PR remoto nem merge.

## Checks

- Gate completo local: aprovado em Node 24.
- Testes: 108 aprovados, 0 falhas.
- Playwright: 18 aprovados, 12 skips intencionais, 0 falhas.
- Axe: 0 violações WCAG 2.1 A/AA nas telas cobertas.
- Build TypeScript/Vite: aprovado.
- `npm audit --audit-level=high`: 0 vulnerabilidades.
- Graphify: 568 nós, 2393 arestas e 24 comunidades na última atualização do código; cache local não versionado.
- CI remota da `main`: aguardando o push deste documento.

## Ambientes comprovados

- Node.js 24;
- PostgreSQL 18 Alpine vazio e cenário de upgrade;
- Docker Compose com duas instâncias da aplicação;
- `APP_ENV=test` e `APP_ENV=demo`;
- recusa de configuração demo em `APP_ENV=production`;
- Chromium em 360×800, 768×1024 e 1440×900, incluindo zoom 200%.

## Severidade

- P0 aberto: 0.
- P1 aberto: 0.
- P2 aberto: 0.
- Registro completo: `docs/final-audit.md`.

## Riscos residuais

- A publicação em hospedagem externa e o restore de um backup real não foram executados; exigem credenciais e janela operacional fora do repositório.
- Registros idempotentes anteriores à migration 022, sem fingerprint, falham de forma segura com `409` se a chave histórica for reutilizada.
- O parser Graphify não interpreta o espelho PowerShell; a fonte Bash foi executada e o comportamento do wrapper é testado.

## Deploy

1. Fixar `bdbab0adf9dc8050c5f400b17a732138fa4d4ec3` como artefato de aplicação.
2. Confirmar variáveis de produção sem qualquer chave `DEMO_*`.
3. Criar backup PostgreSQL e registrar checksum/restauração testada.
4. Executar `node dist/db/migrate.js` uma vez; o lock e os checksums serializam o schema.
5. Subir a imagem, aguardar `/api/health` e executar smoke de autenticação, paciente, prontuário, estoque, Caixa, Financeiro, anexos e laudo.
6. Não executar seed ou reset demo em produção.

## Rollback e restauração

1. Interromper novas mutações e preservar logs de auditoria.
2. Reimplantar o SHA anterior da aplicação.
3. Manter a migration 022: as colunas opcionais são retrocompatíveis.
4. Não remover nem editar vendas, movimentos ou lançamentos; compensar operações financeiras pelo fluxo de estorno.
5. Quando houver corrupção de dados, restaurar o backup em banco isolado, validar migrations/checksum e somente então promover a restauração.
6. Repetir health e todos os smokes antes de reabrir acesso.

## Smoke pós-main

O gate completo sobre a árvore do SHA candidato aprovou health, login, pacientes/dashboard, estoque, Caixa, Financeiro, segurança, anexos e laudo. A confirmação remota será registrada após o push direto da `main`.
