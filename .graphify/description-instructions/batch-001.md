# Node Description Batch 2 of 7

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

- "migrations_002_crm_patients": "002_crm_patients.sql" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion()] | lang=en
- "migrations_004_sales_sales": "sales" | kind=code-symbol | source=migrations/004_sales.sql:L1 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, receivable_installments, company_accounts, patients] | lang=en
- "tests_services_test": "services.test.ts" | kind=code-symbol | source=tests/services.test.ts:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, inventory.ts, validProduct(), services.ts, validExecutionTime()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@0687af4d38261ad728243f2b3b31b07357cc661d": "0687af4 feat(privacy): implementar endpoints de exportação JSON e anonimização …" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/pr8-importacao-csv-seguranca, main, 639a914 feat(privacy): adicionar botão …, app.ts] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@077b08e8bd617dbe8f4cf18ecda777e786a6d740": "077b08e feat(privacy): adicionar migration 010 para pseudonimização LGPD e camp…" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/pr8-importacao-csv-seguranca, main, 0687af4 feat(privacy): implementar endp…, 010_lgpd_privacy.sql] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@639a91490c9b9be8376e3dcd14e78693199cf77c": "639a914 feat(privacy): adicionar botão de portabilidade e anonimização LGPD e f…" | kind=Commit | source=git | neighbors=[0687af4 feat(privacy): implementar endp…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/pr8-importacao-csv-seguranca, main, d13f663 fix(ui): garantir layout respon…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@7fdb702e61229c50653b67287de94e26d054e086": "7fdb702 feat(attachments): adicionar seção de exames na ficha do paciente e atu…" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/pr8-importacao-csv-seguranca, main, ee6a73e feat(privacy): adicionar regras…, main.tsx] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@9c8e9de76a7988a71a39202b7e3dcecfa6fac9a7": "9c8e9de feat(attachments): implementar endpoints de upload, download e listagem…" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/pr8-importacao-csv-seguranca, main, 7fdb702 feat(attachments): adicionar se…, app.ts] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@a3720407ee59aafca15483b8c931e0eb8838b423": "a372040 fix(seed): executar auto-seeding automático de contas demo se a tabela …" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, main, 5fe1e04 feat(doctor): adicionar perfil …, seed.ts, server.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@c067885004204dedd198a86b80aee243bf78bfd9": "c067885 feat(attachments): adicionar migration 009 para tabela de anexos com au…" | kind=Commit | source=git | neighbors=[a7b6a8a feat(attachments): adicionar va…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/pr8-importacao-csv-seguranca, main, 9c8e9de feat(attachments): implementar …] | lang=pt
- "migrations_001_base": "001_base.sql" | kind=code-symbol | source=migrations/001_base.sql:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(), user_sessions] | lang=en
- "migrations_003_follow_up_tasks_restrict_follow_up_update": "restrict_follow_up_update()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L25 | neighbors=[003_follow_up_tasks.sql, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id] | lang=en
- "src_config": "config.ts" | kind=code-symbol | source=src/config.ts:L1 | neighbors=[3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…, pool.ts, seed.ts, app.ts, config] | lang=en
- "tests_csv_import_test": "csv-import.test.ts" | kind=code-symbol | source=tests/csv-import.test.ts:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv-import.ts, calculateCsvHash(), parseCsv(), sanitizeCsvCell(), validateFinancialCsvRow()] | lang=en
- "tests_finance_smoke": "finance-smoke.mjs" | kind=code-symbol | source=tests/finance-smoke.mjs:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, accounts, call(), clientRequestId, login(), payload] | lang=en
- "tests_inventory_test": "inventory.test.ts" | kind=code-symbol | source=tests/inventory.test.ts:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory.ts, validInventoryMovement(), validProduct(), validProductBrand(), validProductModel()] | lang=en
- "tests_patients_test": "patients.test.ts" | kind=code-symbol | source=tests/patients.test.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patients.ts, isOneOf(), normalizePhone(), PATIENT_EVENT_TYPES, PATIENT_STATUSES] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@4de92ceb139c8f6c4cd8917b5d4080934fbfa844": "4de92ce Graphify" | kind=Commit | source=git | neighbors=[0e1c4ad test: consolidar QA, acessibili…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/pr8-importacao-csv-seguranca, main, 98e15b2 feat: implementar importação CS…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@75e42fd49d573ae4aef8872db7551c4eb01c82c4": "75e42fd fix(ui): aplicar flex min-width 0 e empilhamento em coluna no mobile 36…" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, main, 3a29c99 chore(deploy): preparar infraes…, playwright.config.ts, d13f663 fix(ui): garantir layout respon…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@d13f6631276508244a16ccd77efebf49e06cb312": "d13f663 fix(ui): garantir layout responsivo sem overflow horizontal no mobile (…" | kind=Commit | source=git | neighbors=[639a914 feat(privacy): adicionar botão …, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, main, 75e42fd fix(ui): aplicar flex min-width…, main.tsx] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@e5a9115ee3db00ac6905daf01256d50641f1396e": "e5a9115 feat(auth): adicionar botões de login direto 1-clique para contas de de…" | kind=Commit | source=git | neighbors=[b5a2180 fix(deploy): mover dependências…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, main, a372040 fix(seed): executar auto-seedin…, main.tsx] | lang=pt
- "db_migrate": "migrate.ts" | kind=code-symbol | source=src/db/migrate.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate(), pool.ts, pool, server.ts] | lang=en
- "db_pool_pool": "pool" | kind=code-symbol | source=src/db/pool.ts:L9 | neighbors=[create-admin.ts, migrate.ts, pool.ts, seed.ts, app.ts, server.ts] | lang=en
- "domain_patients_normalizephone": "normalizePhone()" | kind=code-symbol | source=src/domain/patients.ts:L10 | neighbors=[csv-import.ts, patients.ts, validPatientPhone(), whatsapp.ts, app.ts, patients.test.ts] | lang=en
- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[csv-import.ts, patients.ts, normalizePhone(), whatsapp.ts, app.ts, patients.test.ts] | lang=en
- "domain_privacy": "privacy.ts" | kind=code-symbol | source=src/domain/privacy.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized(), app.ts, privacy.test.ts] | lang=en
- "domain_security_hashpassword": "hashPassword()" | kind=code-symbol | source=src/domain/security.ts:L5 | neighbors=[create-admin.ts, seed.ts, security.ts, scrypt, app.ts, security.test.ts] | lang=en
- "migrations_004_sales_receivable_installments": "receivable_installments" | kind=code-symbol | source=migrations/004_sales.sql:L25 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, sales, receivable_installments_immutable, receivable_installments_total] | lang=en
- "migrations_007_inventory": "007_inventory.sql" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory_movements, prevent_inventory_movement_modification…, products, trg_prevent_inventory_movement_modifica…, users] | lang=en
- "tests_attachments_test": "attachments.test.ts" | kind=code-symbol | source=tests/attachments.test.ts:L1 | neighbors=[a7b6a8a feat(attachments): adicionar va…, attachments.ts, calculateFileHash(), sanitizeFilename(), validFileSize(), validMimeType()] | lang=en
- "tests_doctors_test": "doctors.test.ts" | kind=code-symbol | source=tests/doctors.test.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, patients.ts, validDoctorId(), doctors.ts, buildCalendarDays(), validLicenseNumber()] | lang=en
- "tests_security_test": "security.test.ts" | kind=code-symbol | source=tests/security.test.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, security.ts, hashPassword(), hashToken(), validCnpj(), verifyPassword()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@557b254c240c1cfccb0827e8b81c7b12b53bc931": "557b254 fix(deploy): corrigir render.yaml para sintaxe válida de Blueprint no R…" | kind=Commit | source=git | neighbors=[3a29c99 chore(deploy): preparar infraes…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, main, b5a2180 fix(deploy): mover dependências…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@68c033be5d296cd83c164e2d674d672802b891ce": "68c033b chore: inicializar main para entregas independentes" | kind=Commit | source=git | neighbors=[codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, codex/pr8-importacao-csv-seguranca, main, 3f9e6cc feat: estabelecer núcleo seguro…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@b5a21802bdb151bfd303eb064946ed6932e7090e": "b5a2180 fix(deploy): mover dependências de build TypeScript para dependencies e…" | kind=Commit | source=git | neighbors=[557b254 fix(deploy): corrigir render.ya…, codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-…, main, e5a9115 feat(auth): adicionar botões de…] | lang=pt
- "domain_doctors": "doctors.ts" | kind=code-symbol | source=src/domain/doctors.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, buildCalendarDays(), CalendarDay, validLicenseNumber(), doctors.test.ts] | lang=en
- "domain_follow_ups": "follow-ups.ts" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, FOLLOW_UP_FILTERS, saoPauloDate(), app.ts, follow-ups.test.ts] | lang=en
- "domain_patients_isoneof": "isOneOf()" | kind=code-symbol | source=src/domain/patients.ts:L9 | neighbors=[csv-import.ts, inventory.ts, patients.ts, app.ts, patients.test.ts] | lang=en
- "domain_sales_validcents": "validCents()" | kind=code-symbol | source=src/domain/sales.ts:L6 | neighbors=[finance.ts, inventory.ts, sales.ts, splitMonthly(), validateInstallments()] | lang=en
- "domain_services_validservice": "validService()" | kind=code-symbol | source=src/domain/services.ts:L33 | neighbors=[services.ts, validExecutionTime(), validServiceName(), app.ts, services.test.ts] | lang=en

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
