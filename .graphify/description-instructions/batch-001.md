# Node Description Batch 2 of 9

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

- "commit:repo:github.com/millennium42/Fonolife@077b08e8bd617dbe8f4cf18ecda777e786a6d740": "077b08e feat(privacy): adicionar migration 010 para pseudonimização LGPD e camp…" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@639a91490c9b9be8376e3dcd14e78693199cf77c": "639a914 feat(privacy): adicionar botão de portabilidade e anonimização LGPD e f…" | kind=Commit | source=git | neighbors=[0687af4 feat(privacy): implementar endp…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@7fdb702e61229c50653b67287de94e26d054e086": "7fdb702 feat(attachments): adicionar seção de exames na ficha do paciente e atu…" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@9c8e9de76a7988a71a39202b7e3dcecfa6fac9a7": "9c8e9de feat(attachments): implementar endpoints de upload, download e listagem…" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@a3720407ee59aafca15483b8c931e0eb8838b423": "a372040 fix(seed): executar auto-seeding automático de contas demo se a tabela …" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@c067885004204dedd198a86b80aee243bf78bfd9": "c067885 feat(attachments): adicionar migration 009 para tabela de anexos com au…" | kind=Commit | source=git | neighbors=[a7b6a8a feat(attachments): adicionar va…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@46934875f17d823f3ccf6ce5ce2813f01697fa4b": "4693487 fix(security): implementa correcoes criticas P0 de producao, LGPD e aut…" | kind=Commit | source=git | neighbors=[codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, main] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@4de92ceb139c8f6c4cd8917b5d4080934fbfa844": "4de92ce Graphify" | kind=Commit | source=git | neighbors=[0e1c4ad test: consolidar QA, acessibili…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@75e42fd49d573ae4aef8872db7551c4eb01c82c4": "75e42fd fix(ui): aplicar flex min-width 0 e empilhamento em coluna no mobile 36…" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@d13f6631276508244a16ccd77efebf49e06cb312": "d13f663 fix(ui): garantir layout responsivo sem overflow horizontal no mobile (…" | kind=Commit | source=git | neighbors=[639a914 feat(privacy): adicionar botão …, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@e5a9115ee3db00ac6905daf01256d50641f1396e": "e5a9115 feat(auth): adicionar botões de login direto 1-clique para contas de de…" | kind=Commit | source=git | neighbors=[b5a2180 fix(deploy): mover dependências…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint] | lang=pt
- "db_seed": "seed.ts" | kind=code-symbol | source=src/db/seed.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, 53e373d Merge branch 'codex/04-design-s…, 5fe1e04 feat(doctor): adicionar perfil …, 9bcad1d feat(seed): povoar banco de dad…, a372040 fix(seed): executar auto-seedin…, bacc003 Merge branch 'codex/fix-seed-fk…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@557b254c240c1cfccb0827e8b81c7b12b53bc931": "557b254 fix(deploy): corrigir render.yaml para sintaxe válida de Blueprint no R…" | kind=Commit | source=git | neighbors=[3a29c99 chore(deploy): preparar infraes…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@68c033be5d296cd83c164e2d674d672802b891ce": "68c033b chore: inicializar main para entregas independentes" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@9cabae8e21d837b46230cce3bdec88adb530b620": "9cabae8 Merge branch 'codex/03-caixa-pdv-relatorio-financeiro' into main" | kind=Commit | source=git | neighbors=[864030b feat(frontend): implementar Cai…, 91c499c Merge branch 'codex/02-medico-r…, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@b5a21802bdb151bfd303eb064946ed6932e7090e": "b5a2180 fix(deploy): mover dependências de build TypeScript para dependencies e…" | kind=Commit | source=git | neighbors=[557b254 fix(deploy): corrigir render.ya…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint] | lang=pt
- "migrations_003_follow_up_tasks": "003_follow_up_tasks.sql" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by] | lang=en
- "src_server": "server.ts" | kind=code-symbol | source=src/server.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, 4693487 fix(security): implementa corre…, a372040 fix(seed): executar auto-seedin…, migrate.ts, migrate(), pool.ts] | lang=en
- "tests_security_object_lgpd_test": "security-object-lgpd.test.ts" | kind=code-symbol | source=tests/security-object-lgpd.test.ts:L1 | neighbors=[0b8c651 fix(csrf): endurecer validacao …, a01c4f0 fix(security): centralizar carr…, privacy.ts, anonymizePatientName(), security.ts, canExportPatientData()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@864030bfdcbee9352bc2b5110ffb0e04e085a9b6": "864030b feat(frontend): implementar Caixa PDV, prontuario global por clique e r…" | kind=Commit | source=git | neighbors=[codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@53e373d34bd5576ad198ae4d314d7188c0affda4": "53e373d Merge branch 'codex/04-design-system-seed-demo' into main" | kind=Commit | source=git | neighbors=[codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@9bcad1d4dc8e1e57867350c198d32e13ad147621": "9bcad1d feat(seed): povoar banco de dados com informacoes realistas para demons…" | kind=Commit | source=git | neighbors=[codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@bacc0034551890f1fcab390d37f4e7c45d66c7db": "bacc003 Merge branch 'codex/fix-seed-fk-constraint' into main" | kind=Commit | source=git | neighbors=[552fbd9 chore: atualizar grafo de conhe…, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@e517fa0fbf903d361cecc9acc57d2d1b20695f69": "e517fa0 refactor(core): implementa correcoes de confiabilidade e arquitetura P1" | kind=Commit | source=git | neighbors=[4693487 fix(security): implementa corre…, routes.ts, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments] | lang=nl
- "domain_sales": "sales.ts" | kind=code-symbol | source=src/domain/sales.ts:L1 | neighbors=[a740db5 feat: registrar vendas com parc…, csv-import.ts, finance.ts, inventory.ts, DELIVERY_STATUSES, PAYMENT_METHODS] | lang=en
- "domain_services": "services.ts" | kind=code-symbol | source=src/domain/services.ts:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, inventory.ts, validNonNegativeCents(), ServiceInput, ServiceItem] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@552fbd9fc4b65b3631d08f6cb47d11f8bf5d5b61": "552fbd9 chore: atualizar grafo de conhecimento do graphify final" | kind=Commit | source=git | neighbors=[53e373d Merge branch 'codex/04-design-s…, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@a412d5eba3d71b0e6d16922209342c9c9fad2a35": "a412d5e Merge branch 'codex/quick-demo-login-buttons' into main" | kind=Commit | source=git | neighbors=[23a1618 feat(frontend): adicionar botoe…, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@e6906b30c8fa139d4659bf16308c8b5d73781576": "e6906b3 fix(seed): resolver IDs existentes no banco para evitar violacao de cha…" | kind=Commit | source=git | neighbors=[552fbd9 chore: atualizar grafo de conhe…, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd] | lang=en
- "db_pool": "pool.ts" | kind=code-symbol | source=src/db/pool.ts:L1 | neighbors=[routes.ts, 3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate.ts, pool] | lang=en
- "domain_attachments_localattachmentstorage": "LocalAttachmentStorage" | kind=code-symbol | source=src/domain/attachments.ts:L34 | neighbors=[attachments.ts, AttachmentStorage, .constructor(), .delete(), .exists(), .getFilePath()] | lang=en
- "migrations_004_sales_financial_entries": "financial_entries" | kind=code-symbol | source=migrations/004_sales.sql:L35 | neighbors=[004_sales.sql, company_accounts, financial_entries, patients, receivable_installments, sales] | lang=en
- "tests_security_test": "security.test.ts" | kind=code-symbol | source=tests/security.test.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, 4693487 fix(security): implementa corre…, security.ts, canExportPatientData(), canReadAttachment(), canReadPatient()] | lang=en
- "auth_routes": "routes.ts" | kind=code-symbol | source=src/modules/auth/routes.ts:L1 | neighbors=[authRoutes(), pool.ts, pool, security.ts, hashPassword(), hashToken()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@23a1618f94b22fd8c3a4e2e35b26c4ca85dfa9a0": "23a1618 feat(frontend): adicionar botoes de atalho para login instantaneo nos 3…" | kind=Commit | source=git | neighbors=[codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/quick-demo-login-buttons] | lang=pt
- "domain_attachments_s3attachmentstorage": "S3AttachmentStorage" | kind=code-symbol | source=src/domain/attachments.ts:L118 | neighbors=[attachments.ts, AttachmentStorage, .constructor(), .delete(), .exists(), .getBucketName()] | lang=en
- "domain_finance": "finance.ts" | kind=code-symbol | source=src/domain/finance.ts:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, csv-import.ts, ENTRY_TYPES, FINANCE_CATEGORIES, validFinancialEntry(), sales.ts] | lang=en
- "migrations_004_sales_restrict_sale_update": "restrict_sale_update()" | kind=code-symbol | source=migrations/004_sales.sql:L71 | neighbors=[004_sales.sql, OLD.client_request_id, OLD.company_account_id, OLD.created_at, OLD.created_by, OLD.patient_id] | lang=en
- "src_config": "config.ts" | kind=code-symbol | source=src/config.ts:L1 | neighbors=[routes.ts, 3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…, 4693487 fix(security): implementa corre…, c45b42d refactor(attachments): introduz…, pool.ts] | lang=en
- "tests_secure_attachments_test": "secure-attachments.test.ts" | kind=code-symbol | source=tests/secure-attachments.test.ts:L1 | neighbors=[d183f47 test(attachments): reproduzir s…, attachments.ts, detectMimeTypeFromMagicBytes(), DevAttachmentScanner, generateStorageKey(), LocalAttachmentStorage] | lang=en

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
