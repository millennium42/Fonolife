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
