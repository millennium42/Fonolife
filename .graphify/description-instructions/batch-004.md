# Node Description Batch 5 of 6

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

- "migrations_003_follow_up_tasks_reject_follow_up_deletion": "reject_follow_up_deletion()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L19 | neighbors=[003_follow_up_tasks.sql]
- "migrations_004_sales_reject_financial_changes": "reject_financial_changes()" | kind=code-symbol | source=migrations/004_sales.sql:L58 | neighbors=[004_sales.sql]
- "migrations_004_sales_reject_installment_changes": "reject_installment_changes()" | kind=code-symbol | source=migrations/004_sales.sql:L79 | neighbors=[004_sales.sql]
- "migrations_005_finance": "005_finance.sql" | kind=code-symbol | source=migrations/005_finance.sql:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…]
- "migrations_007_inventory_prevent_inventory_movement_modification": "prevent_inventory_movement_modification()" | kind=code-symbol | source=migrations/007_inventory.sql:L24 | neighbors=[007_inventory.sql]
- "playwright_config": "playwright.config.ts" | kind=code-symbol | source=playwright.config.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…]
- "src_app_attempts": "attempts" | kind=code-symbol | source=src/app.ts:L54 | neighbors=[app.ts]
- "src_app_fastifyrequest": "FastifyRequest" | kind=code-symbol | source=src/app.ts:L50 | neighbors=[app.ts]
- "src_app_user": "User" | kind=code-symbol | source=src/app.ts:L42 | neighbors=[app.ts]
- "src_main_api": "api()" | kind=code-symbol | source=web/src/main.tsx:L137 | neighbors=[main.tsx]
- "src_main_app": "App()" | kind=code-symbol | source=web/src/main.tsx:L1868 | neighbors=[main.tsx]
- "src_main_categorylabels": "categoryLabels" | kind=code-symbol | source=web/src/main.tsx:L1051 | neighbors=[main.tsx]
- "src_main_cents": "cents()" | kind=code-symbol | source=web/src/main.tsx:L148 | neighbors=[main.tsx]
- "src_main_companyaccount": "CompanyAccount" | kind=code-symbol | source=web/src/main.tsx:L46 | neighbors=[main.tsx]
- "src_main_csvimport": "CsvImport()" | kind=code-symbol | source=web/src/main.tsx:L1746 | neighbors=[main.tsx]
- "src_main_dashboarddata": "DashboardData" | kind=code-symbol | source=web/src/main.tsx:L89 | neighbors=[main.tsx]
- "src_main_eventtypes": "eventTypes" | kind=code-symbol | source=web/src/main.tsx:L119 | neighbors=[main.tsx]
- "src_main_financesummary": "FinanceSummary" | kind=code-symbol | source=web/src/main.tsx:L75 | neighbors=[main.tsx]
- "src_main_financialentry": "FinancialEntry" | kind=code-symbol | source=web/src/main.tsx:L52 | neighbors=[main.tsx]
- "src_main_followup": "FollowUp" | kind=code-symbol | source=web/src/main.tsx:L35 | neighbors=[main.tsx]
- "src_main_followups": "FollowUps()" | kind=code-symbol | source=web/src/main.tsx:L756 | neighbors=[main.tsx]
- "src_main_inventory": "Inventory()" | kind=code-symbol | source=web/src/main.tsx:L1559 | neighbors=[main.tsx]
- "src_main_monthly": "monthly()" | kind=code-symbol | source=web/src/main.tsx:L153 | neighbors=[main.tsx]
- "src_main_patient": "Patient" | kind=code-symbol | source=web/src/main.tsx:L12 | neighbors=[main.tsx]
- "src_main_patientform": "PatientForm()" | kind=code-symbol | source=web/src/main.tsx:L382 | neighbors=[main.tsx]
- "src_main_patients": "Patients()" | kind=code-symbol | source=web/src/main.tsx:L897 | neighbors=[main.tsx]
- "src_main_paymentlabels": "paymentLabels" | kind=code-symbol | source=web/src/main.tsx:L1042 | neighbors=[main.tsx]
- "src_main_receivable": "Receivable" | kind=code-symbol | source=web/src/main.tsx:L64 | neighbors=[main.tsx]
- "src_main_sources": "sources" | kind=code-symbol | source=web/src/main.tsx:L111 | neighbors=[main.tsx]
- "src_main_statuses": "statuses" | kind=code-symbol | source=web/src/main.tsx:L101 | neighbors=[main.tsx]
- "src_main_timelineitem": "TimelineItem" | kind=code-symbol | source=web/src/main.tsx:L27 | neighbors=[main.tsx]
- "src_main_user": "User" | kind=code-symbol | source=web/src/main.tsx:L6 | neighbors=[main.tsx]
- "src_main_whatsappbutton": "WhatsAppButton()" | kind=code-symbol | source=web/src/main.tsx:L1517 | neighbors=[main.tsx]
- "tests_dashboard_smoke_dashboard": "dashboard()" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L9 | neighbors=[dashboard-smoke.mjs]
- "tests_dashboard_smoke_login": "login()" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L4 | neighbors=[dashboard-smoke.mjs]
- "tests_dashboard_test": "dashboard.test.ts" | kind=code-symbol | source=tests/dashboard.test.ts:L1 | neighbors=[a56a353 feat: priorizar filas acionávei…]
- "tests_devsec_smoke_login": "login()" | kind=code-symbol | source=tests/devsec-smoke.mjs:L14 | neighbors=[devsec-smoke.mjs]
- "tests_finance_smoke_accounts": "accounts" | kind=code-symbol | source=tests/finance-smoke.mjs:L10 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_call": "call()" | kind=code-symbol | source=tests/finance-smoke.mjs:L6 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_clientrequestid": "clientRequestId" | kind=code-symbol | source=tests/finance-smoke.mjs:L11 | neighbors=[finance-smoke.mjs]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-004.json

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
