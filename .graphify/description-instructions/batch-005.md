# Node Description Batch 6 of 7

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
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "migrations_005_finance": "005_finance.sql" | kind=code-symbol | source=migrations/005_finance.sql:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…]
- "migrations_007_inventory_prevent_inventory_movement_modification": "prevent_inventory_movement_modification()" | kind=code-symbol | source=migrations/007_inventory.sql:L24 | neighbors=[007_inventory.sql]
- "migrations_008_whatsapp_shortcuts": "008_whatsapp_shortcuts.sql" | kind=code-symbol | source=migrations/008_whatsapp_shortcuts.sql:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…]
- "migrations_010_lgpd_privacy": "010_lgpd_privacy.sql" | kind=code-symbol | source=migrations/010_lgpd_privacy.sql:L1 | neighbors=[077b08e feat(privacy): adicionar migrat…]
- "src_app_attempts": "attempts" | kind=code-symbol | source=src/app.ts:L68 | neighbors=[app.ts]
- "src_app_fastifyrequest": "FastifyRequest" | kind=code-symbol | source=src/app.ts:L64 | neighbors=[app.ts]
- "src_app_user": "User" | kind=code-symbol | source=src/app.ts:L56 | neighbors=[app.ts]
- "src_main_api": "api()" | kind=code-symbol | source=web/src/main.tsx:L138 | neighbors=[main.tsx]
- "src_main_app": "App()" | kind=code-symbol | source=web/src/main.tsx:L1972 | neighbors=[main.tsx]
- "src_main_categorylabels": "categoryLabels" | kind=code-symbol | source=web/src/main.tsx:L1155 | neighbors=[main.tsx]
- "src_main_cents": "cents()" | kind=code-symbol | source=web/src/main.tsx:L149 | neighbors=[main.tsx]
- "src_main_companyaccount": "CompanyAccount" | kind=code-symbol | source=web/src/main.tsx:L47 | neighbors=[main.tsx]
- "src_main_csvimport": "CsvImport()" | kind=code-symbol | source=web/src/main.tsx:L1850 | neighbors=[main.tsx]
- "src_main_dashboarddata": "DashboardData" | kind=code-symbol | source=web/src/main.tsx:L90 | neighbors=[main.tsx]
- "src_main_eventtypes": "eventTypes" | kind=code-symbol | source=web/src/main.tsx:L120 | neighbors=[main.tsx]
- "src_main_financesummary": "FinanceSummary" | kind=code-symbol | source=web/src/main.tsx:L76 | neighbors=[main.tsx]
- "src_main_financialentry": "FinancialEntry" | kind=code-symbol | source=web/src/main.tsx:L53 | neighbors=[main.tsx]
- "src_main_followup": "FollowUp" | kind=code-symbol | source=web/src/main.tsx:L36 | neighbors=[main.tsx]
- "src_main_followups": "FollowUps()" | kind=code-symbol | source=web/src/main.tsx:L860 | neighbors=[main.tsx]
- "src_main_inventory": "Inventory()" | kind=code-symbol | source=web/src/main.tsx:L1663 | neighbors=[main.tsx]
- "src_main_monthly": "monthly()" | kind=code-symbol | source=web/src/main.tsx:L154 | neighbors=[main.tsx]
- "src_main_patient": "Patient" | kind=code-symbol | source=web/src/main.tsx:L12 | neighbors=[main.tsx]
- "src_main_patientattachments": "PatientAttachments()" | kind=code-symbol | source=web/src/main.tsx:L531 | neighbors=[main.tsx]
- "src_main_patientform": "PatientForm()" | kind=code-symbol | source=web/src/main.tsx:L383 | neighbors=[main.tsx]
- "src_main_patients": "Patients()" | kind=code-symbol | source=web/src/main.tsx:L1001 | neighbors=[main.tsx]
- "src_main_paymentlabels": "paymentLabels" | kind=code-symbol | source=web/src/main.tsx:L1146 | neighbors=[main.tsx]
- "src_main_receivable": "Receivable" | kind=code-symbol | source=web/src/main.tsx:L65 | neighbors=[main.tsx]
- "src_main_sources": "sources" | kind=code-symbol | source=web/src/main.tsx:L112 | neighbors=[main.tsx]
- "src_main_statuses": "statuses" | kind=code-symbol | source=web/src/main.tsx:L102 | neighbors=[main.tsx]
- "src_main_timelineitem": "TimelineItem" | kind=code-symbol | source=web/src/main.tsx:L28 | neighbors=[main.tsx]
- "src_main_user": "User" | kind=code-symbol | source=web/src/main.tsx:L6 | neighbors=[main.tsx]
- "src_main_whatsappbutton": "WhatsAppButton()" | kind=code-symbol | source=web/src/main.tsx:L1621 | neighbors=[main.tsx]
- "tests_dashboard_smoke_dashboard": "dashboard()" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L9 | neighbors=[dashboard-smoke.mjs]
- "tests_dashboard_smoke_login": "login()" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L4 | neighbors=[dashboard-smoke.mjs]
- "tests_dashboard_test": "dashboard.test.ts" | kind=code-symbol | source=tests/dashboard.test.ts:L1 | neighbors=[a56a353 feat: priorizar filas acionávei…]
- "tests_devsec_smoke_login": "login()" | kind=code-symbol | source=tests/devsec-smoke.mjs:L14 | neighbors=[devsec-smoke.mjs]
- "tests_finance_smoke_accounts": "accounts" | kind=code-symbol | source=tests/finance-smoke.mjs:L10 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_call": "call()" | kind=code-symbol | source=tests/finance-smoke.mjs:L6 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_clientrequestid": "clientRequestId" | kind=code-symbol | source=tests/finance-smoke.mjs:L11 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_login": "login()" | kind=code-symbol | source=tests/finance-smoke.mjs:L5 | neighbors=[finance-smoke.mjs]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-005.json

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
