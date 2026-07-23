# Node Description Batch 1 of 7

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

- "src_app": "app.ts" | kind=code-symbol | source=src/app.ts:L1 | neighbors=[0687af4 feat(privacy): implementar endp…, 0d2db0f feat: centralizar cadastro e hi…, 0e1c4ad test: consolidar QA, acessibili…, 2dd873d feat: consolidar financeiro úni…, 3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…] | lang=en
- "src_main": "main.tsx" | kind=code-symbol | source=web/src/main.tsx:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, 0e1c4ad test: consolidar QA, acessibili…, 2dd873d feat: consolidar financeiro úni…, 3f9e6cc feat: estabelecer núcleo seguro…, 5ccde91 feat: implementar atalhos rápid…, 639a914 feat(privacy): adicionar botão …] | lang=en
- "migrations_004_sales": "004_sales.sql" | kind=code-symbol | source=migrations/004_sales.sql:L1 | neighbors=[a740db5 feat: registrar vendas com parc…, actual, check_sale_installment_total(), company_accounts, expected, financial_entries] | lang=en
- "branch:repo:github.com/millennium42/Fonolife#main": "main" | kind=Branch | source=git | neighbors=[0687af4 feat(privacy): implementar endp…, 077b08e feat(privacy): adicionar migrat…, 0d2db0f feat: centralizar cadastro e hi…, 0e1c4ad test: consolidar QA, acessibili…, 2dd873d feat: consolidar financeiro úni…, 3a29c99 chore(deploy): preparar infraes…] | lang=en
- "domain_csv_import": "csv-import.ts" | kind=code-symbol | source=src/domain/csv-import.ts:L1 | neighbors=[98e15b2 feat: implementar importação CS…, calculateCsvHash(), CsvFinancialRow, CsvPatientRow, parseCsv(), ParsedCsv] | lang=en
- "branch:repo:github.com/millennium42/Fonolife#codex/pr8-importacao-csv-seguranca": "codex/pr8-importacao-csv-seguranca" | kind=Branch | source=git | neighbors=[0687af4 feat(privacy): implementar endp…, 077b08e feat(privacy): adicionar migrat…, 0d2db0f feat: centralizar cadastro e hi…, 0e1c4ad test: consolidar QA, acessibili…, 2dd873d feat: consolidar financeiro úni…, 3f9e6cc feat: estabelecer núcleo seguro…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@3f9e6cc4ee2be1fcd0fc398ec030b217b86560cc": "3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1)" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, 0d2db0f feat: centralizar cadastro e hi…, migrate.ts, pool.ts, seed.ts] | lang=pt
- "domain_inventory": "inventory.ts" | kind=code-symbol | source=src/domain/inventory.ts:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement()] | lang=en
- "domain_patients": "patients.ts" | kind=code-symbol | source=src/domain/patients.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, csv-import.ts, inventory.ts, CONTACT_SOURCES, ContactSource, isOneOf()] | lang=en
- "migrations_003_follow_up_tasks": "003_follow_up_tasks.sql" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by] | lang=en
- "src_server": "server.ts" | kind=code-symbol | source=src/server.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, a372040 fix(seed): executar auto-seedin…, migrate.ts, migrate(), pool.ts, pool] | lang=en
- "domain_sales": "sales.ts" | kind=code-symbol | source=src/domain/sales.ts:L1 | neighbors=[a740db5 feat: registrar vendas com parc…, csv-import.ts, finance.ts, inventory.ts, DELIVERY_STATUSES, PAYMENT_METHODS] | lang=en
- "migrations_004_sales_financial_entries": "financial_entries" | kind=code-symbol | source=migrations/004_sales.sql:L35 | neighbors=[004_sales.sql, company_accounts, financial_entries, patients, receivable_installments, sales] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@0e1c4ad00aec060f9267a26fbcd71079fbb8ae7c": "0e1c4ad test: consolidar QA, acessibilidade e release do Fonolife (#7)" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, 4de92ce Graphify, create-admin.ts, critical-flow.spec.ts, playwright.config.ts] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@2dd873dd8370128456a9fb5af27ad18e677f5d92": "2dd873d feat: consolidar financeiro único para dois CNPJs (#5)" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, a56a353 feat: priorizar filas acionávei…, finance.ts, 005_finance.sql, app.ts] | lang=en
- "db_pool": "pool.ts" | kind=code-symbol | source=src/db/pool.ts:L1 | neighbors=[3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate.ts, pool, config.ts] | lang=en
- "db_seed": "seed.ts" | kind=code-symbol | source=src/db/seed.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, a372040 fix(seed): executar auto-seedin…, pool.ts, pool, seedDemo(), security.ts] | lang=en
- "domain_finance": "finance.ts" | kind=code-symbol | source=src/domain/finance.ts:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, csv-import.ts, ENTRY_TYPES, FINANCE_CATEGORIES, validFinancialEntry(), sales.ts] | lang=en
- "domain_security": "security.ts" | kind=code-symbol | source=src/domain/security.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, seed.ts, hashPassword(), hashToken(), scrypt] | lang=en
- "migrations_004_sales_restrict_sale_update": "restrict_sale_update()" | kind=code-symbol | source=migrations/004_sales.sql:L71 | neighbors=[004_sales.sql, OLD.client_request_id, OLD.company_account_id, OLD.created_at, OLD.created_by, OLD.patient_id] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@0d2db0f27bb1efab7eb477d46a4040d0cbf24d15": "0d2db0f feat: centralizar cadastro e histórico de pacientes (#2)" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, ff35345 feat: tornar o pós-atendimento …, patients.ts, 002_crm_patients.sql, app.ts] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@5ccde9133865212a6dce14d60334c1edc14c4d90": "5ccde91 feat: implementar atalhos rápidos de comunicação via WhatsApp com audit…" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, a7b6a8a feat(attachments): adicionar va…, whatsapp.ts, 008_whatsapp_shortcuts.sql, app.ts] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@98e15b232d3362549543120d010f27f51e2970dc": "98e15b2 feat: implementar importação CSV idempotente com auditoria e controle d…" | kind=Commit | source=git | neighbors=[4de92ce Graphify, codex/pr8-importacao-csv-seguranca, main, bb925aa feat: implementar catálogo e co…, csv-import.ts, 006_csv_imports.sql] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@a740db5e2f3ed64c59732d051c499f2b3f2446d5": "a740db5 feat: registrar vendas com parcelas e pós-venda automático (#4)" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, 2dd873d feat: consolidar financeiro úni…, sales.ts, 004_sales.sql, app.ts] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@bb925aac9ea903fe4803dbad8e3b87f80d8c23e6": "bb925aa feat: implementar catálogo e controle de estoque de aparelhos com audit…" | kind=Commit | source=git | neighbors=[98e15b2 feat: implementar importação CS…, codex/pr8-importacao-csv-seguranca, main, 5ccde91 feat: implementar atalhos rápid…, inventory.ts, 007_inventory.sql] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@ff35345149eb090c35dd5865167baa3a4f69893f": "ff35345 feat: tornar o pós-atendimento uma fila acionável (#3)" | kind=Commit | source=git | neighbors=[0d2db0f feat: centralizar cadastro e hi…, codex/pr8-importacao-csv-seguranca, main, a740db5 feat: registrar vendas com parc…, follow-ups.ts, 003_follow_up_tasks.sql] | lang=pt
- "domain_attachments": "attachments.ts" | kind=code-symbol | source=src/domain/attachments.ts:L1 | neighbors=[a7b6a8a feat(attachments): adicionar va…, ALLOWED_MIME_TYPES, AllowedMimeType, calculateFileHash(), sanitizeFilename(), validFileSize()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@a56a353df4c2544d1505c5510d04a77ebfef63b4": "a56a353 feat: priorizar filas acionáveis no dashboard (#6)" | kind=Commit | source=git | neighbors=[2dd873d feat: consolidar financeiro úni…, codex/pr8-importacao-csv-seguranca, main, 0e1c4ad test: consolidar QA, acessibili…, app.ts, main.tsx] | lang=pt
- "db_create_admin": "create-admin.ts" | kind=code-symbol | source=src/db/create-admin.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, email, migrate.ts, migrate(), pool.ts, pool] | lang=en
- "domain_whatsapp": "whatsapp.ts" | kind=code-symbol | source=src/domain/whatsapp.ts:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…, patients.ts, normalizePhone(), validPatientPhone(), buildWhatsAppLink(), formatE164Phone()] | lang=en
- "migrations_002_crm_patients": "002_crm_patients.sql" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion()] | lang=en
- "migrations_004_sales_sales": "sales" | kind=code-symbol | source=migrations/004_sales.sql:L1 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, receivable_installments, company_accounts, patients] | lang=en
- "migrations_001_base": "001_base.sql" | kind=code-symbol | source=migrations/001_base.sql:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(), user_sessions] | lang=en
- "migrations_003_follow_up_tasks_restrict_follow_up_update": "restrict_follow_up_update()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L25 | neighbors=[003_follow_up_tasks.sql, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id] | lang=en
- "src_config": "config.ts" | kind=code-symbol | source=src/config.ts:L1 | neighbors=[3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…, pool.ts, seed.ts, app.ts, config] | lang=en
- "tests_csv_import_test": "csv-import.test.ts" | kind=code-symbol | source=tests/csv-import.test.ts:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv-import.ts, calculateCsvHash(), parseCsv(), sanitizeCsvCell(), validateFinancialCsvRow()] | lang=en
- "tests_finance_smoke": "finance-smoke.mjs" | kind=code-symbol | source=tests/finance-smoke.mjs:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, accounts, call(), clientRequestId, login(), payload] | lang=en
- "tests_inventory_test": "inventory.test.ts" | kind=code-symbol | source=tests/inventory.test.ts:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory.ts, validInventoryMovement(), validProduct(), validProductBrand(), validProductModel()] | lang=en
- "tests_patients_test": "patients.test.ts" | kind=code-symbol | source=tests/patients.test.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patients.ts, isOneOf(), normalizePhone(), PATIENT_EVENT_TYPES, PATIENT_STATUSES] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@3a29c99a1263689e4b1f3d823a776b973aee3c9d": "3a29c99 chore(deploy): preparar infraestrutura no Render com Blueprint, SSL e c…" | kind=Commit | source=git | neighbors=[main, 557b254 fix(deploy): corrigir render.ya…, pool.ts, app.ts, config.ts, 75e42fd fix(ui): aplicar flex min-width…] | lang=pt

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-000.json

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
