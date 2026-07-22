# Graph Report - .  (2026-07-22)

## Corpus Check
- Corpus is ~32.872 words - fits in a single context window. You may not need a graph.

## Summary
- 186 nodes · 369 edges · 10 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 140 · imports: 64 · MODIFIES: 48 · imports_from: 30 · reads_from: 20 · ON_BRANCH: 19 · references: 19 · calls: 10 · triggers: 10 · PARENT_OF: 9


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 65 · Candidates: 118
- Excluded: 3 untracked · 6221 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `98e15b2`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `financial_entries` - 11 edges
2. `restrict_sale_update()` - 10 edges
3. `sales` - 8 edges
4. `restrict_follow_up_update()` - 7 edges
5. `receivable_installments` - 6 edges
6. `hashPassword()` - 6 edges
7. `follow_up_tasks` - 5 edges
8. `check_sale_installment_total()` - 5 edges
9. `config` - 5 edges
10. `pool` - 5 edges

## Surprising Connections (you probably didn't know these)
- `3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1)` --ON_BRANCH--> `codex/pr8-importacao-csv-seguranca`  [EXTRACTED]
  git → git  _Bridges community 4 → community 3_
- `4de92ce Graphify` --PARENT_OF--> `98e15b2 feat: implementar importação CSV idempotente com auditoria e controle de concorrência (#8)`  [EXTRACTED]
  git → git  _Bridges community 3 → community 0_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (31): 98e15b2 feat: implementar importação CSV idempotente com auditoria e controle de concorrência (#8), calculateCsvHash(), CsvFinancialRow, CsvPatientRow, parseCsv(), ParsedCsv, sanitizeCsvCell(), validateFinancialCsvRow() (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (21): categoryLabels, CompanyAccount, Dashboard(), DashboardData, date(), eventTypes, Finance(), FinanceSummary (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (25): actual, check_sale_installment_total(), company_accounts, expected, financial_entries, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (12): codex/pr8-importacao-csv-seguranca, main, 0d2db0f feat: centralizar cadastro e histórico de pacientes (#2), 0e1c4ad test: consolidar QA, acessibilidade e release do Fonolife (#7), 2dd873d feat: consolidar financeiro único para dois CNPJs (#5), 4de92ce Graphify, 68c033b chore: inicializar main para entregas independentes, a56a353 feat: priorizar filas acionáveis no dashboard (#6) (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (12): 3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1), email, migrate(), pool, seedDemo(), hashPassword(), hashToken(), scrypt (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (12): follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.43
Nodes (5): patient_events, patient_events_immutable, patients, patients_no_delete, users

### Community 7 - "Community 7"
Cohesion: 0.43
Nodes (5): audit_events, audit_events_immutable, company_accounts, user_sessions, users

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (4): accounts, clientRequestId, payload, summary

### Community 9 - "Community 9"
Cohesion: 0.83
Nodes (3): csv_import_errors, csv_import_jobs, users

## Knowledge Gaps
- **29 isolated node(s):** `company_accounts`, `User`, `FastifyRequest`, `attempts`, `email` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hashPassword()` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `pool` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `verifyPassword()` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `company_accounts`, `User`, `FastifyRequest` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11153846153846154 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07526881720430108 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._