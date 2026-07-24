# Node Description Batch 2 of 11

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the prompt below and write
your JSON answer to the answer file.

## Prompt

You are documenting nodes in a knowledge graph.
For each entry below, write ONE concise factual plain-language sentence
describing what it is or does. Use only the provided context.
For a code symbol (kind=code-symbol — a function, class, or constant),
describe what the function/symbol does based on its name, source location
and neighbors — e.g. "Resolves the configured ontology profile from graphify.yaml.".
For an entity node (any other kind — e.g. a person, place, event, object),
describe what the entity is and its role, grounded in its type, its
relations (neighbors) and the provided citations/evidence — e.g.
"Lady Carfax, a wealthy heiress who disappears en route to Lausanne.".
Ground entity descriptions in the citations/evidence when present; do not
speculate beyond the context, so a node with no supporting context may be
left out of the reply.
LANGUAGE: each entry has a `lang=` marker giving the language of its source.
Write that entry's description in EXACTLY that language. Do not translate to
a single common language — match each node's source language individually.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "domain_inventory": "inventory.ts" | kind=code-symbol | source=src/domain/inventory.ts:L1 | neighbors=[264533a feat(services): adicionar migra…, bb925aa feat: implementar catálogo e co…, d7896dd Merge branch 'codex/01-servicos…, InventoryMovement, MOVEMENT_TYPES, MovementType] | lang=en
- "branch:repo:github.com/millennium42/Fonolife#codex/pr8-importacao-csv-seguranca": "codex/pr8-importacao-csv-seguranca" | kind=Branch | source=git | neighbors=[0687af4 feat(privacy): implementar endp…, 077b08e feat(privacy): adicionar migrat…, 0d2db0f feat: centralizar cadastro e hi…, 0e1c4ad test: consolidar QA, acessibili…, 2dd873d feat: consolidar financeiro úni…, 3f9e6cc feat: estabelecer núcleo seguro…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@0687af4d38261ad728243f2b3b31b07357cc661d": "0687af4 feat(privacy): implementar endpoints de exportação JSON e anonimização …" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 639a914 feat(privacy): adicionar botão …, app.ts, 077b08e feat(privacy): adicionar migrat…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@077b08e8bd617dbe8f4cf18ecda777e786a6d740": "077b08e feat(privacy): adicionar migration 010 para pseudonimização LGPD e camp…" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 0687af4 feat(privacy): implementar endp…, 010_lgpd_privacy.sql, ee6a73e feat(privacy): adicionar regras…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@639a91490c9b9be8376e3dcd14e78693199cf77c": "639a914 feat(privacy): adicionar botão de portabilidade e anonimização LGPD e f…" | kind=Commit | source=git | neighbors=[0687af4 feat(privacy): implementar endp…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, d13f663 fix(ui): garantir layout respon…, main.tsx] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@7fdb702e61229c50653b67287de94e26d054e086": "7fdb702 feat(attachments): adicionar seção de exames na ficha do paciente e atu…" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, ee6a73e feat(privacy): adicionar regras…, main.tsx, 9c8e9de feat(attachments): implementar …] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@9c8e9de76a7988a71a39202b7e3dcecfa6fac9a7": "9c8e9de feat(attachments): implementar endpoints de upload, download e listagem…" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 7fdb702 feat(attachments): adicionar se…, app.ts, c067885 feat(attachments): adicionar mi…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@a3720407ee59aafca15483b8c931e0eb8838b423": "a372040 fix(seed): executar auto-seeding automático de contas demo se a tabela …" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 5fe1e04 feat(doctor): adicionar perfil …, seed.ts, server.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@c067885004204dedd198a86b80aee243bf78bfd9": "c067885 feat(attachments): adicionar migration 009 para tabela de anexos com au…" | kind=Commit | source=git | neighbors=[a7b6a8a feat(attachments): adicionar va…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 9c8e9de feat(attachments): implementar …, 009_attachments.sql] | lang=pt
- "domain_patients": "patients.ts" | kind=code-symbol | source=src/domain/patients.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, 91c499c Merge branch 'codex/02-medico-r…, b0009ad feat(patients): adicionar medic…, csv-import.ts, inventory.ts, CONTACT_SOURCES] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@46934875f17d823f3ccf6ce5ce2813f01697fa4b": "4693487 fix(security): implementa correcoes criticas P0 de producao, LGPD e aut…" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, e517fa0 refactor(core): implementa corr…, security.ts, 014_lgpd_redactions.sql] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@4de92ceb139c8f6c4cd8917b5d4080934fbfa844": "4de92ce Graphify" | kind=Commit | source=git | neighbors=[0e1c4ad test: consolidar QA, acessibili…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 98e15b2 feat: implementar importação CS…, codex/01-servicos-catalogo-estoque] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@75e42fd49d573ae4aef8872db7551c4eb01c82c4": "75e42fd fix(ui): aplicar flex min-width 0 e empilhamento em coluna no mobile 36…" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 3a29c99 chore(deploy): preparar infraes…, playwright.config.ts, d13f663 fix(ui): garantir layout respon…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@d13f6631276508244a16ccd77efebf49e06cb312": "d13f663 fix(ui): garantir layout responsivo sem overflow horizontal no mobile (…" | kind=Commit | source=git | neighbors=[639a914 feat(privacy): adicionar botão …, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 75e42fd fix(ui): aplicar flex min-width…, main.tsx] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@e5a9115ee3db00ac6905daf01256d50641f1396e": "e5a9115 feat(auth): adicionar botões de login direto 1-clique para contas de de…" | kind=Commit | source=git | neighbors=[b5a2180 fix(deploy): mover dependências…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, a372040 fix(seed): executar auto-seedin…, main.tsx] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@557b254c240c1cfccb0827e8b81c7b12b53bc931": "557b254 fix(deploy): corrigir render.yaml para sintaxe válida de Blueprint no R…" | kind=Commit | source=git | neighbors=[3a29c99 chore(deploy): preparar infraes…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, b5a2180 fix(deploy): mover dependências…, codex/01-servicos-catalogo-estoque] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@68c033be5d296cd83c164e2d674d672802b891ce": "68c033b chore: inicializar main para entregas independentes" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 3f9e6cc feat: estabelecer núcleo seguro…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@9cabae8e21d837b46230cce3bdec88adb530b620": "9cabae8 Merge branch 'codex/03-caixa-pdv-relatorio-financeiro' into main" | kind=Commit | source=git | neighbors=[864030b feat(frontend): implementar Cai…, 91c499c Merge branch 'codex/02-medico-r…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 53e373d Merge branch 'codex/04-design-s…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@b5a21802bdb151bfd303eb064946ed6932e7090e": "b5a2180 fix(deploy): mover dependências de build TypeScript para dependencies e…" | kind=Commit | source=git | neighbors=[557b254 fix(deploy): corrigir render.ya…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, e5a9115 feat(auth): adicionar botões de…, codex/01-servicos-catalogo-estoque] | lang=pt
- "auth_routes": "routes.ts" | kind=code-symbol | source=src/modules/auth/routes.ts:L1 | neighbors=[middleware.ts, clearLoginFailures(), isLoginRateLimited(), recordLoginFailure(), revokeUserSessions(), authRoutes()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@864030bfdcbee9352bc2b5110ffb0e04e085a9b6": "864030b feat(frontend): implementar Caixa PDV, prontuario global por clique e r…" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 9cabae8 Merge branch 'codex/03-caixa-pd…, main.tsx, 91c499c Merge branch 'codex/02-medico-r…] | lang=en
- "src_config": "config.ts" | kind=code-symbol | source=src/config.ts:L1 | neighbors=[middleware.ts, routes.ts, 3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…, 4693487 fix(security): implementa corre…, 7e2a065 fix(auth): remover fallback sil…] | lang=en
- "auth_middleware": "middleware.ts" | kind=code-symbol | source=src/modules/auth/middleware.ts:L1 | neighbors=[cleanupExpiredSessions(), clearLoginFailures(), getRateLimitKey(), isLoginRateLimited(), memoryRateLimit, memorySessions] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@53e373d34bd5576ad198ae4d314d7188c0affda4": "53e373d Merge branch 'codex/04-design-system-seed-demo' into main" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 552fbd9 chore: atualizar grafo de conhe…, seed.ts, 9bcad1d feat(seed): povoar banco de dad…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@9bcad1d4dc8e1e57867350c198d32e13ad147621": "9bcad1d feat(seed): povoar banco de dados com informacoes realistas para demons…" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 53e373d Merge branch 'codex/04-design-s…, seed.ts, 9cabae8 Merge branch 'codex/03-caixa-pd…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@bacc0034551890f1fcab390d37f4e7c45d66c7db": "bacc003 Merge branch 'codex/fix-seed-fk-constraint' into main" | kind=Commit | source=git | neighbors=[552fbd9 chore: atualizar grafo de conhe…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 23a1618 feat(frontend): adicionar botoe…, a412d5e Merge branch 'codex/quick-demo-…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@e517fa0fbf903d361cecc9acc57d2d1b20695f69": "e517fa0 refactor(core): implementa correcoes de confiabilidade e arquitetura P1" | kind=Commit | source=git | neighbors=[4693487 fix(security): implementa corre…, routes.ts, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 1091aa4 feat(core): implementa melhoria…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@552fbd9fc4b65b3631d08f6cb47d11f8bf5d5b61": "552fbd9 chore: atualizar grafo de conhecimento do graphify final" | kind=Commit | source=git | neighbors=[53e373d Merge branch 'codex/04-design-s…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, bacc003 Merge branch 'codex/fix-seed-fk…, e6906b3 fix(seed): resolver IDs existen…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@a412d5eba3d71b0e6d16922209342c9c9fad2a35": "a412d5e Merge branch 'codex/quick-demo-login-buttons' into main" | kind=Commit | source=git | neighbors=[23a1618 feat(frontend): adicionar botoe…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 4693487 fix(security): implementa corre…, 7139d08 docs: adicionar guia de desenvo…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@e6906b30c8fa139d4659bf16308c8b5d73781576": "e6906b3 fix(seed): resolver IDs existentes no banco para evitar violacao de cha…" | kind=Commit | source=git | neighbors=[552fbd9 chore: atualizar grafo de conhe…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, bacc003 Merge branch 'codex/fix-seed-fk…, seed.ts] | lang=en
- "db_seed": "seed.ts" | kind=code-symbol | source=src/db/seed.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, 53e373d Merge branch 'codex/04-design-s…, 5fe1e04 feat(doctor): adicionar perfil …, 9bcad1d feat(seed): povoar banco de dad…, a372040 fix(seed): executar auto-seedin…, bacc003 Merge branch 'codex/fix-seed-fk…] | lang=en
- "tests_auth_session_test": "auth-session.test.ts" | kind=code-symbol | source=tests/auth-session.test.ts:L1 | neighbors=[1524f7f test(auth): cobrir limite distr…, 438f52a fix(auth): tornar revogação de …, middleware.ts, cleanupExpiredSessions(), clearLoginFailures(), getRateLimitKey()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@23a1618f94b22fd8c3a4e2e35b26c4ca85dfa9a0": "23a1618 feat(frontend): adicionar botoes de atalho para login instantaneo nos 3…" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, a412d5e Merge branch 'codex/quick-demo-…, main.tsx, bacc003 Merge branch 'codex/fix-seed-fk…] | lang=pt
- "db_pool": "pool.ts" | kind=code-symbol | source=src/db/pool.ts:L1 | neighbors=[routes.ts, 3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate.ts, pool] | lang=en
- "migrations_003_follow_up_tasks": "003_follow_up_tasks.sql" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by] | lang=en
- "src_server": "server.ts" | kind=code-symbol | source=src/server.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, 4693487 fix(security): implementa corre…, a372040 fix(seed): executar auto-seedin…, migrate.ts, migrate(), pool.ts] | lang=en
- "tests_security_object_lgpd_test": "security-object-lgpd.test.ts" | kind=code-symbol | source=tests/security-object-lgpd.test.ts:L1 | neighbors=[0b8c651 fix(csrf): endurecer validacao …, a01c4f0 fix(security): centralizar carr…, privacy.ts, anonymizePatientName(), security.ts, canExportPatientData()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@a01c4f0b6281d0c7b01db1b4c47ea4f9787c489a": "a01c4f0 fix(security): centralizar carregamento e autorizacao de pacientes" | kind=Commit | source=git | neighbors=[0b8c651 fix(csrf): endurecer validacao …, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, cbaee24 docs(security): documentar matr…, security.ts] | lang=en
- "domain_attachments_localattachmentstorage": "LocalAttachmentStorage" | kind=code-symbol | source=src/domain/attachments.ts:L35 | neighbors=[attachments.ts, AttachmentStorage, .constructor(), .delete(), .exists(), .getFilePath()] | lang=en
- "domain_attachments_s3attachmentstorage": "S3AttachmentStorage" | kind=code-symbol | source=src/domain/attachments.ts:L119 | neighbors=[attachments.ts, AttachmentStorage, .constructor(), .delete(), .exists(), .getBucketName()] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-001.json

Keep each description factual and concise (one sentence). No markdown, no prose
outside the JSON object. It is acceptable to omit a node if context is
insufficient — but include every node you can ground confidently.

Example answer format:
```json
{
  "node_id_1": "Resolves the configured ontology profile from graphify.yaml.",
  "node_id_2": "Colonel James Barclay, an antagonist in The Crooked Man."
}
```
