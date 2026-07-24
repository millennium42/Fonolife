# Graph Report - .  (2026-07-24)

## Corpus Check
- 120 files · ~68.795 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 421 nodes · 1670 edges · 19 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: ON_BRANCH: 811 · contains: 241 · imports: 187 · MODIFIES: 152 · PARENT_OF: 84 · imports_from: 73 · calls: 40 · references: 27 · reads_from: 20 · method: 19 · triggers: 11 · implements: 5


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 120 · Candidates: 285
- Excluded: 0 untracked · 6428 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `e79f008`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `LocalAttachmentStorage` - 12 edges
2. `S3AttachmentStorage` - 12 edges
3. `financial_entries` - 11 edges
4. `restrict_sale_update()` - 10 edges
5. `pool` - 10 edges
6. `sales` - 8 edges
7. `validProduct()` - 8 edges
8. `hashPassword()` - 8 edges
9. `restrict_follow_up_update()` - 7 edges
10. `config` - 7 edges

## Surprising Connections (you probably didn't know these)
- `0687af4 feat(privacy): implementar endpoints de exportação JSON e anonimização LGPD com auditoria (#12)` --ON_BRANCH--> `codex/pr-05-auth-csrf-hardening`  [EXTRACTED]
  git → git  _Bridges community 0 → community 3_
- `3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1)` --ON_BRANCH--> `codex/pr-05-auth-csrf-hardening`  [EXTRACTED]
  git → git  _Bridges community 2 → community 3_
- `3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1)` --PARENT_OF--> `0d2db0f feat: centralizar cadastro e histórico de pacientes (#2)`  [EXTRACTED]
  git → git  _Bridges community 2 → community 0_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (70): codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-global, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais (+62 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (42): calculateCsvHash(), calculateVersionedCsvHash(), CsvFinancialRow, CsvPatientRow, isValidCivilDate(), isValidUuid(), parseCsv(), ParsedCsv (+34 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (34): cleanupExpiredSessions(), clearLoginFailures(), getRateLimitKey(), isLoginRateLimited(), memoryRateLimit, memorySessions, recordLoginFailure(), revokeUserSessions() (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (43): codex/pr-04-csv-validation, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boundary, main, 0b8c651 fix(csrf): endurecer validacao de origem, 1091aa4 feat(core): implementa melhorias operacionais e de qualidade P2, 1524f7f test(auth): cobrir limite distribuído e revogação de sessões, 1af0f9a docs(auth): documentar origem, falhas e recuperação (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (21): ALLOWED_MIME_TYPES, AllowedMimeType, AttachmentScanner, AttachmentScanResult, AttachmentStatus, AttachmentStorage, calculateFileHash(), ClamAVAttachmentScanner (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (25): actual, check_sale_installment_total(), company_accounts, expected, financial_entries, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.19
Nodes (16): InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement(), validNonNegativeCents(), validProduct(), validProductBrand() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (12): follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.43
Nodes (5): patient_events, patient_events_immutable, patients, patients_no_delete, users

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (5): audit_events, audit_events_immutable, company_accounts, user_sessions, users

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (4): accounts, clientRequestId, payload, summary

### Community 11 - "Community 11"
Cohesion: 0.47
Nodes (4): buildCalendarDays(), CalendarDay, validLicenseNumber(), validDoctorId()

### Community 12 - "Community 12"
Cohesion: 0.53
Nodes (4): inventory_movements, products, trg_prevent_inventory_movement_modification, users

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (6): Dashboard(), DoctorCalendar(), Finance(), money(), SaleForm(), today()

### Community 14 - "Community 14"
Cohesion: 0.83
Nodes (3): csv_import_errors, csv_import_jobs, users

### Community 15 - "Community 15"
Cohesion: 0.83
Nodes (3): patient_attachments, patients, users

### Community 16 - "Community 16"
Cohesion: 0.83
Nodes (3): products, service_products, services

### Community 17 - "Community 17"
Cohesion: 0.83
Nodes (3): patient_redactions, patients, users

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (4): api(), for(), monthly(), submit()

## Knowledge Gaps
- **52 isolated node(s):** `company_accounts`, `login_rate_limits`, `User`, `FastifyRequest`, `attachmentMaxBytes` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `S3AttachmentStorage` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `LocalAttachmentStorage` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `ClamAVAttachmentScanner` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `company_accounts`, `login_rate_limits`, `User` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1297335203366059 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07948568088836938 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10448979591836735 - nodes in this community are weakly interconnected._