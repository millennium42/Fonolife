# Node Description Batch 2 of 5

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
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[patients.ts, normalizePhone(), app.ts, patients.test.ts]
- "domain_sales_validateinstallments": "validateInstallments()" | kind=code-symbol | source=src/domain/sales.ts:L10 | neighbors=[sales.ts, validCents(), app.ts, sales.test.ts]
- "domain_sales_validcents": "validCents()" | kind=code-symbol | source=src/domain/sales.ts:L6 | neighbors=[finance.ts, sales.ts, splitMonthly(), validateInstallments()]
- "domain_security_verifypassword": "verifyPassword()" | kind=code-symbol | source=src/domain/security.ts:L11 | neighbors=[security.ts, scrypt, app.ts, security.test.ts]
- "migrations_002_crm_patients_patient_events": "patient_events" | kind=code-symbol | source=migrations/002_crm_patients.sql:L30 | neighbors=[002_crm_patients.sql, patients, users, patient_events_immutable]
- "migrations_002_crm_patients_patients": "patients" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[002_crm_patients.sql, patient_events, users, patients_no_delete]
- "tests_follow_ups_test": "follow-ups.test.ts" | kind=code-symbol | source=tests/follow-ups.test.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, follow-ups.ts, FOLLOW_UP_FILTERS, saoPauloDate()]
- "tests_sales_test": "sales.test.ts" | kind=code-symbol | source=tests/sales.test.ts:L1 | neighbors=[a740db5 feat: registrar vendas com parc…, sales.ts, splitMonthly(), validateInstallments()]
- "commit:repo:github.com/millennium42/Fonolife@4de92ceb139c8f6c4cd8917b5d4080934fbfa844": "4de92ce Graphify" | kind=Commit | source=git | neighbors=[0e1c4ad test: consolidar QA, acessibili…, codex/pr8-importacao-csv-seguranca, main]
- "commit:repo:github.com/millennium42/Fonolife@68c033be5d296cd83c164e2d674d672802b891ce": "68c033b chore: inicializar main para entregas independentes" | kind=Commit | source=git | neighbors=[codex/pr8-importacao-csv-seguranca, main, 3f9e6cc feat: estabelecer núcleo seguro…]
- "db_migrate_migrate": "migrate()" | kind=code-symbol | source=src/db/migrate.ts:L7 | neighbors=[create-admin.ts, migrate.ts, server.ts]
- "domain_finance_validfinancialentry": "validFinancialEntry()" | kind=code-symbol | source=src/domain/finance.ts:L6 | neighbors=[finance.ts, app.ts, finance.test.ts]
- "domain_follow_ups_follow_up_filters": "FOLLOW_UP_FILTERS" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[follow-ups.ts, app.ts, follow-ups.test.ts]
- "domain_patients_isoneof": "isOneOf()" | kind=code-symbol | source=src/domain/patients.ts:L9 | neighbors=[patients.ts, app.ts, patients.test.ts]
- "domain_patients_patient_event_types": "PATIENT_EVENT_TYPES" | kind=code-symbol | source=src/domain/patients.ts:L3 | neighbors=[patients.ts, app.ts, patients.test.ts]
- "domain_patients_patient_statuses": "PATIENT_STATUSES" | kind=code-symbol | source=src/domain/patients.ts:L1 | neighbors=[patients.ts, app.ts, patients.test.ts]
- "domain_sales_splitmonthly": "splitMonthly()" | kind=code-symbol | source=src/domain/sales.ts:L17 | neighbors=[sales.ts, validCents(), sales.test.ts]
- "domain_security_hashtoken": "hashToken()" | kind=code-symbol | source=src/domain/security.ts:L18 | neighbors=[security.ts, app.ts, security.test.ts]
- "domain_security_scrypt": "scrypt" | kind=code-symbol | source=src/domain/security.ts:L3 | neighbors=[security.ts, hashPassword(), verifyPassword()]
- "domain_security_validcnpj": "validCnpj()" | kind=code-symbol | source=src/domain/security.ts:L20 | neighbors=[security.ts, app.ts, security.test.ts]
- "e2e_critical_flow_spec": "critical-flow.spec.ts" | kind=code-symbol | source=tests/e2e/critical-flow.spec.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, accessible(), login()]
- "migrations_001_base_audit_events": "audit_events" | kind=code-symbol | source=migrations/001_base.sql:L32 | neighbors=[001_base.sql, users, audit_events_immutable]
- "migrations_001_base_users": "users" | kind=code-symbol | source=migrations/001_base.sql:L3 | neighbors=[001_base.sql, audit_events, user_sessions]
- "migrations_002_crm_patients_users": "users" | kind=code-symbol | source=migrations/002_crm_patients.sql:L12 | neighbors=[002_crm_patients.sql, patient_events, patients]
- "migrations_004_sales_company_accounts": "company_accounts" | kind=code-symbol | source=migrations/004_sales.sql:L9 | neighbors=[004_sales.sql, financial_entries, sales]
- "migrations_004_sales_patients": "patients" | kind=code-symbol | source=migrations/004_sales.sql:L4 | neighbors=[004_sales.sql, financial_entries, sales]
- "migrations_004_sales_users": "users" | kind=code-symbol | source=migrations/004_sales.sql:L14 | neighbors=[004_sales.sql, financial_entries, sales]
- "src_main_finance": "Finance()" | kind=code-symbol | source=web/src/main.tsx:L1065 | neighbors=[main.tsx, money(), today()]
- "src_main_money": "money()" | kind=code-symbol | source=web/src/main.tsx:L1038 | neighbors=[main.tsx, Dashboard(), Finance()]
- "src_main_today": "today()" | kind=code-symbol | source=web/src/main.tsx:L144 | neighbors=[main.tsx, Finance(), SaleForm()]
- "tests_dashboard_smoke": "dashboard-smoke.mjs" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L1 | neighbors=[a56a353 feat: priorizar filas acionávei…, dashboard(), login()]
- "tests_finance_test": "finance.test.ts" | kind=code-symbol | source=tests/finance.test.ts:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, finance.ts, validFinancialEntry()]
- "db_seed_seeddemo": "seedDemo()" | kind=code-symbol | source=src/db/seed.ts:L6 | neighbors=[seed.ts, server.ts]
- "domain_follow_ups_saopaulodate": "saoPauloDate()" | kind=code-symbol | source=src/domain/follow-ups.ts:L3 | neighbors=[follow-ups.ts, follow-ups.test.ts]
- "domain_patients_contact_sources": "CONTACT_SOURCES" | kind=code-symbol | source=src/domain/patients.ts:L2 | neighbors=[patients.ts, app.ts]
- "domain_patients_validpatientname": "validPatientName()" | kind=code-symbol | source=src/domain/patients.ts:L11 | neighbors=[patients.ts, app.ts]
- "domain_sales_delivery_statuses": "DELIVERY_STATUSES" | kind=code-symbol | source=src/domain/sales.ts:L2 | neighbors=[sales.ts, app.ts]
- "domain_sales_payment_methods": "PAYMENT_METHODS" | kind=code-symbol | source=src/domain/sales.ts:L1 | neighbors=[finance.ts, sales.ts]
- "domain_sales_saleinstallment": "SaleInstallment" | kind=code-symbol | source=src/domain/sales.ts:L4 | neighbors=[sales.ts, app.ts]
- "migrations_001_base_audit_events_immutable": "audit_events_immutable" | kind=code-symbol | source=migrations/001_base.sql:L45 | neighbors=[001_base.sql, audit_events]

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
