# Node Description Batch 8 of 8

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

- "src_main_patient": "Patient" | kind=code-symbol | source=web/src/main.tsx:L14 | neighbors=[main.tsx]
- "src_main_patientattachments": "PatientAttachments()" | kind=code-symbol | source=web/src/main.tsx:L533 | neighbors=[main.tsx]
- "src_main_patientform": "PatientForm()" | kind=code-symbol | source=web/src/main.tsx:L385 | neighbors=[main.tsx]
- "src_main_patientnamelink": "PatientNameLink()" | kind=code-symbol | source=web/src/main.tsx:L234 | neighbors=[main.tsx]
- "src_main_patients": "Patients()" | kind=code-symbol | source=web/src/main.tsx:L1003 | neighbors=[main.tsx]
- "src_main_paymentlabels": "paymentLabels" | kind=code-symbol | source=web/src/main.tsx:L1148 | neighbors=[main.tsx]
- "src_main_productitem": "ProductItem" | kind=code-symbol | source=web/src/main.tsx:L90 | neighbors=[main.tsx]
- "src_main_receivable": "Receivable" | kind=code-symbol | source=web/src/main.tsx:L69 | neighbors=[main.tsx]
- "src_main_serviceitem": "ServiceItem" | kind=code-symbol | source=web/src/main.tsx:L80 | neighbors=[main.tsx]
- "src_main_sources": "sources" | kind=code-symbol | source=web/src/main.tsx:L114 | neighbors=[main.tsx]
- "src_main_statuses": "statuses" | kind=code-symbol | source=web/src/main.tsx:L104 | neighbors=[main.tsx]
- "src_main_timelineitem": "TimelineItem" | kind=code-symbol | source=web/src/main.tsx:L32 | neighbors=[main.tsx]
- "src_main_user": "User" | kind=code-symbol | source=web/src/main.tsx:L6 | neighbors=[main.tsx]
- "src_main_whatsappbutton": "WhatsAppButton()" | kind=code-symbol | source=web/src/main.tsx:L1623 | neighbors=[main.tsx]
- "src_server_usercount": "userCount" | kind=code-symbol | source=src/server.ts:L8 | neighbors=[server.ts]
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
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-007.json

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
