# Node Description Batch 6 of 6

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

- "src_app_user": "User" | kind=code-symbol | source=src/app.ts:L56 | neighbors=[app.ts]
- "src_main_api": "api()" | kind=code-symbol | source=web/src/main.tsx:L138 | neighbors=[main.tsx]
- "src_main_app": "App()" | kind=code-symbol | source=web/src/main.tsx:L1971 | neighbors=[main.tsx]
- "src_main_categorylabels": "categoryLabels" | kind=code-symbol | source=web/src/main.tsx:L1154 | neighbors=[main.tsx]
- "src_main_cents": "cents()" | kind=code-symbol | source=web/src/main.tsx:L149 | neighbors=[main.tsx]
- "src_main_companyaccount": "CompanyAccount" | kind=code-symbol | source=web/src/main.tsx:L47 | neighbors=[main.tsx]
- "src_main_csvimport": "CsvImport()" | kind=code-symbol | source=web/src/main.tsx:L1849 | neighbors=[main.tsx]
- "src_main_dashboarddata": "DashboardData" | kind=code-symbol | source=web/src/main.tsx:L90 | neighbors=[main.tsx]
- "src_main_eventtypes": "eventTypes" | kind=code-symbol | source=web/src/main.tsx:L120 | neighbors=[main.tsx]
- "src_main_financesummary": "FinanceSummary" | kind=code-symbol | source=web/src/main.tsx:L76 | neighbors=[main.tsx]
- "src_main_financialentry": "FinancialEntry" | kind=code-symbol | source=web/src/main.tsx:L53 | neighbors=[main.tsx]
- "src_main_followup": "FollowUp" | kind=code-symbol | source=web/src/main.tsx:L36 | neighbors=[main.tsx]
- "src_main_followups": "FollowUps()" | kind=code-symbol | source=web/src/main.tsx:L859 | neighbors=[main.tsx]
- "src_main_inventory": "Inventory()" | kind=code-symbol | source=web/src/main.tsx:L1662 | neighbors=[main.tsx]
- "src_main_monthly": "monthly()" | kind=code-symbol | source=web/src/main.tsx:L154 | neighbors=[main.tsx]
- "src_main_patient": "Patient" | kind=code-symbol | source=web/src/main.tsx:L12 | neighbors=[main.tsx]
- "src_main_patientattachments": "PatientAttachments()" | kind=code-symbol | source=web/src/main.tsx:L531 | neighbors=[main.tsx]
- "src_main_patientform": "PatientForm()" | kind=code-symbol | source=web/src/main.tsx:L383 | neighbors=[main.tsx]
- "src_main_patients": "Patients()" | kind=code-symbol | source=web/src/main.tsx:L1000 | neighbors=[main.tsx]
- "src_main_paymentlabels": "paymentLabels" | kind=code-symbol | source=web/src/main.tsx:L1145 | neighbors=[main.tsx]
- "src_main_receivable": "Receivable" | kind=code-symbol | source=web/src/main.tsx:L65 | neighbors=[main.tsx]
- "src_main_sources": "sources" | kind=code-symbol | source=web/src/main.tsx:L112 | neighbors=[main.tsx]
- "src_main_statuses": "statuses" | kind=code-symbol | source=web/src/main.tsx:L102 | neighbors=[main.tsx]
- "src_main_timelineitem": "TimelineItem" | kind=code-symbol | source=web/src/main.tsx:L28 | neighbors=[main.tsx]
- "src_main_user": "User" | kind=code-symbol | source=web/src/main.tsx:L6 | neighbors=[main.tsx]
- "src_main_whatsappbutton": "WhatsAppButton()" | kind=code-symbol | source=web/src/main.tsx:L1620 | neighbors=[main.tsx]
- "tests_dashboard_smoke_dashboard": "dashboard()" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L9 | neighbors=[dashboard-smoke.mjs]
- "tests_dashboard_smoke_login": "login()" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L4 | neighbors=[dashboard-smoke.mjs]
- "tests_dashboard_test": "dashboard.test.ts" | kind=code-symbol | source=tests/dashboard.test.ts:L1 | neighbors=[a56a353 feat: priorizar filas acionávei…]
- "tests_devsec_smoke_login": "login()" | kind=code-symbol | source=tests/devsec-smoke.mjs:L14 | neighbors=[devsec-smoke.mjs]
- "tests_finance_smoke_accounts": "accounts" | kind=code-symbol | source=tests/finance-smoke.mjs:L10 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_call": "call()" | kind=code-symbol | source=tests/finance-smoke.mjs:L6 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_clientrequestid": "clientRequestId" | kind=code-symbol | source=tests/finance-smoke.mjs:L11 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_login": "login()" | kind=code-symbol | source=tests/finance-smoke.mjs:L5 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_payload": "payload" | kind=code-symbol | source=tests/finance-smoke.mjs:L12 | neighbors=[finance-smoke.mjs]
- "tests_finance_smoke_summary": "summary" | kind=code-symbol | source=tests/finance-smoke.mjs:L18 | neighbors=[finance-smoke.mjs]
- "tests_migrate_test": "migrate.test.ts" | kind=code-symbol | source=tests/migrate.test.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…]
- "vite_config": "vite.config.ts" | kind=code-symbol | source=vite.config.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…]

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
