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

- "commit:repo:github.com/millennium42/Fonolife@a7b6a8aa273cd821f47413a95b294051c96d51f8": "a7b6a8a feat(attachments): adicionar validação de exames, tipos MIME permitidos…" | kind=Commit | source=git | neighbors=[5ccde91 feat: implementar atalhos rápid…, codex/pr8-importacao-csv-seguranca, main, c067885 feat(attachments): adicionar mi…, attachments.ts, attachments.test.ts] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@ee6a73e7d8372d8a3e8ab04f35c5d051d8e39184": "ee6a73e feat(privacy): adicionar regras de pseudonimização LGPD e exportação de…" | kind=Commit | source=git | neighbors=[7fdb702 feat(attachments): adicionar se…, codex/pr8-importacao-csv-seguranca, main, 077b08e feat(privacy): adicionar migrat…, privacy.ts, privacy.test.ts] | lang=pt
- "db_migrate": "migrate.ts" | kind=code-symbol | source=src/db/migrate.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate(), pool.ts, pool, server.ts] | lang=en
- "db_pool_pool": "pool" | kind=code-symbol | source=src/db/pool.ts:L9 | neighbors=[create-admin.ts, migrate.ts, pool.ts, seed.ts, app.ts, server.ts] | lang=en
- "domain_inventory_validproduct": "validProduct()" | kind=code-symbol | source=src/domain/inventory.ts:L38 | neighbors=[inventory.ts, validProductBrand(), validProductModel(), validProductName(), app.ts, inventory.test.ts] | lang=en
- "domain_patients_normalizephone": "normalizePhone()" | kind=code-symbol | source=src/domain/patients.ts:L10 | neighbors=[csv-import.ts, patients.ts, validPatientPhone(), whatsapp.ts, app.ts, patients.test.ts] | lang=en
- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[csv-import.ts, patients.ts, normalizePhone(), whatsapp.ts, app.ts, patients.test.ts] | lang=en
- "domain_privacy": "privacy.ts" | kind=code-symbol | source=src/domain/privacy.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized(), app.ts, privacy.test.ts] | lang=en
- "domain_security_hashpassword": "hashPassword()" | kind=code-symbol | source=src/domain/security.ts:L5 | neighbors=[create-admin.ts, seed.ts, security.ts, scrypt, app.ts, security.test.ts] | lang=en
- "migrations_004_sales_receivable_installments": "receivable_installments" | kind=code-symbol | source=migrations/004_sales.sql:L25 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, sales, receivable_installments_immutable, receivable_installments_total] | lang=en
- "migrations_007_inventory": "007_inventory.sql" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory_movements, prevent_inventory_movement_modification…, products, trg_prevent_inventory_movement_modifica…, users] | lang=en
- "tests_attachments_test": "attachments.test.ts" | kind=code-symbol | source=tests/attachments.test.ts:L1 | neighbors=[a7b6a8a feat(attachments): adicionar va…, attachments.ts, calculateFileHash(), sanitizeFilename(), validFileSize(), validMimeType()] | lang=en
- "tests_security_test": "security.test.ts" | kind=code-symbol | source=tests/security.test.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, security.ts, hashPassword(), hashToken(), validCnpj(), verifyPassword()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@0687af4d38261ad728243f2b3b31b07357cc661d": "0687af4 feat(privacy): implementar endpoints de exportação JSON e anonimização …" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, 639a914 feat(privacy): adicionar botão …, app.ts, 077b08e feat(privacy): adicionar migrat…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@077b08e8bd617dbe8f4cf18ecda777e786a6d740": "077b08e feat(privacy): adicionar migration 010 para pseudonimização LGPD e camp…" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, 0687af4 feat(privacy): implementar endp…, 010_lgpd_privacy.sql, ee6a73e feat(privacy): adicionar regras…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@639a91490c9b9be8376e3dcd14e78693199cf77c": "639a914 feat(privacy): adicionar botão de portabilidade e anonimização LGPD e f…" | kind=Commit | source=git | neighbors=[0687af4 feat(privacy): implementar endp…, codex/pr8-importacao-csv-seguranca, main, d13f663 fix(ui): garantir layout respon…, main.tsx] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@7fdb702e61229c50653b67287de94e26d054e086": "7fdb702 feat(attachments): adicionar seção de exames na ficha do paciente e atu…" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, ee6a73e feat(privacy): adicionar regras…, main.tsx, 9c8e9de feat(attachments): implementar …] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@9c8e9de76a7988a71a39202b7e3dcecfa6fac9a7": "9c8e9de feat(attachments): implementar endpoints de upload, download e listagem…" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, 7fdb702 feat(attachments): adicionar se…, app.ts, c067885 feat(attachments): adicionar mi…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@c067885004204dedd198a86b80aee243bf78bfd9": "c067885 feat(attachments): adicionar migration 009 para tabela de anexos com au…" | kind=Commit | source=git | neighbors=[a7b6a8a feat(attachments): adicionar va…, codex/pr8-importacao-csv-seguranca, main, 9c8e9de feat(attachments): implementar …, 009_attachments.sql] | lang=pt
- "domain_follow_ups": "follow-ups.ts" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, FOLLOW_UP_FILTERS, saoPauloDate(), app.ts, follow-ups.test.ts] | lang=en
- "domain_patients_isoneof": "isOneOf()" | kind=code-symbol | source=src/domain/patients.ts:L9 | neighbors=[csv-import.ts, inventory.ts, patients.ts, app.ts, patients.test.ts] | lang=en
- "domain_sales_validcents": "validCents()" | kind=code-symbol | source=src/domain/sales.ts:L6 | neighbors=[finance.ts, inventory.ts, sales.ts, splitMonthly(), validateInstallments()] | lang=en
- "migrations_003_follow_up_tasks_follow_up_tasks": "follow_up_tasks" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L1 | neighbors=[003_follow_up_tasks.sql, patients, users, follow_up_tasks_no_delete, follow_up_tasks_restrict_update] | lang=en
- "migrations_004_sales_check_sale_installment_total": "check_sale_installment_total()" | kind=code-symbol | source=migrations/004_sales.sql:L84 | neighbors=[004_sales.sql, actual, expected, receivable_installments, sales] | lang=en
- "src_config_config": "config" | kind=code-symbol | source=src/config.ts:L1 | neighbors=[pool.ts, seed.ts, app.ts, config.ts, server.ts] | lang=en
- "tests_privacy_test": "privacy.test.ts" | kind=code-symbol | source=tests/privacy.test.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, privacy.ts, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized()] | lang=en
- "tests_whatsapp_test": "whatsapp.test.ts" | kind=code-symbol | source=tests/whatsapp.test.ts:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…, whatsapp.ts, buildWhatsAppLink(), formatE164Phone(), WHATSAPP_TEMPLATES] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@4de92ceb139c8f6c4cd8917b5d4080934fbfa844": "4de92ce Graphify" | kind=Commit | source=git | neighbors=[0e1c4ad test: consolidar QA, acessibili…, codex/pr8-importacao-csv-seguranca, main, 98e15b2 feat: implementar importação CS…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@75e42fd49d573ae4aef8872db7551c4eb01c82c4": "75e42fd fix(ui): aplicar flex min-width 0 e empilhamento em coluna no mobile 36…" | kind=Commit | source=git | neighbors=[main, 3a29c99 chore(deploy): preparar infraes…, playwright.config.ts, d13f663 fix(ui): garantir layout respon…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@d13f6631276508244a16ccd77efebf49e06cb312": "d13f663 fix(ui): garantir layout responsivo sem overflow horizontal no mobile (…" | kind=Commit | source=git | neighbors=[639a914 feat(privacy): adicionar botão …, main, 75e42fd fix(ui): aplicar flex min-width…, main.tsx] | lang=en
- "domain_patients_patient_statuses": "PATIENT_STATUSES" | kind=code-symbol | source=src/domain/patients.ts:L1 | neighbors=[csv-import.ts, patients.ts, app.ts, patients.test.ts] | lang=en
- "domain_sales_validateinstallments": "validateInstallments()" | kind=code-symbol | source=src/domain/sales.ts:L10 | neighbors=[sales.ts, validCents(), app.ts, sales.test.ts] | lang=en
- "domain_security_verifypassword": "verifyPassword()" | kind=code-symbol | source=src/domain/security.ts:L11 | neighbors=[security.ts, scrypt, app.ts, security.test.ts] | lang=en
- "migrations_002_crm_patients_patient_events": "patient_events" | kind=code-symbol | source=migrations/002_crm_patients.sql:L30 | neighbors=[002_crm_patients.sql, patients, users, patient_events_immutable] | lang=en
- "migrations_002_crm_patients_patients": "patients" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[002_crm_patients.sql, patient_events, users, patients_no_delete] | lang=en
- "migrations_006_csv_imports": "006_csv_imports.sql" | kind=code-symbol | source=migrations/006_csv_imports.sql:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv_import_errors, csv_import_jobs, users] | lang=en
- "migrations_007_inventory_inventory_movements": "inventory_movements" | kind=code-symbol | source=migrations/007_inventory.sql:L12 | neighbors=[007_inventory.sql, products, users, trg_prevent_inventory_movement_modifica…] | lang=en
- "migrations_009_attachments": "009_attachments.sql" | kind=code-symbol | source=migrations/009_attachments.sql:L1 | neighbors=[c067885 feat(attachments): adicionar mi…, patient_attachments, patients, users] | lang=en
- "tests_follow_ups_test": "follow-ups.test.ts" | kind=code-symbol | source=tests/follow-ups.test.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, follow-ups.ts, FOLLOW_UP_FILTERS, saoPauloDate()] | lang=en
- "tests_sales_test": "sales.test.ts" | kind=code-symbol | source=tests/sales.test.ts:L1 | neighbors=[a740db5 feat: registrar vendas com parc…, sales.ts, splitMonthly(), validateInstallments()] | lang=en

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
