# Documentação 5W2H — PR 04: CSV RFC 4180, Schemas e Validação de Entrada

## 1. Matriz 5W2H
- **What (O que):** Refatoração completa e endurecimento do pipeline de importação CSV e validação de entrada:
  1. Parser estrito RFC 4180 em `src/domain/csv-import.ts` com remoção de BOM UTF-8, tratamento de campos multilinha, aspas duplas escapadas (`""`), rejeição imediata de aspas não balanceadas, validação de cabeçalhos obrigatórios, bloqueio de cabeçalhos duplicados e verificação da quantidade de colunas por linha.
  2. Política explícita de fórmula injection: **preservação integral dos valores iniciados por `=`, `+`, `-` ou `@` na importação**, aplicando sanitização (`sanitizeCsvCell`) estritamente na exportação de planilhas.
  3. Validação rigorosa de tipos e domínios: verificação de **datas civis reais no calendário gregoriano** (`isValidCivilDate`), validação de **UUID RFC 4122** para IDs de conta de caixa e checagem de existência da conta no banco de dados.
  4. Idempotência concorrente e hash canônico versionado: `calculateVersionedCsvHash(entityType, content, "v2")` incorporando o tipo de entidade e a versão do parser para evitar colisão entre esquemas diferentes.
  5. Módulo de rotas dedicado em `src/modules/import/routes.ts` utilizando schemas HTTP Fastify (JSON Schema) para validação de `body`, `params` e tratamento de erros via Problem Details (RFC 7807).
  6. Endpoint de reprocessamento explícito de jobs falhos (`POST /api/admin/import/csv/:id/reprocess`).
- **Why (Por que):** Prevenir falhas silenciosas de importação, garantir integridade dos dados clínicos e financeiros sem alterar inadvertidamente entradas com operadores numéricos ou de fórmula, impedir importações duplicadas em ambiente concorrente e fornecer mensagens legíveis e padronizadas de erro por linha.
- **Where (Onde):** `src/domain/csv-import.ts`, `src/modules/import/routes.ts`, `src/app.ts`, `tests/csv-import.test.ts`, `tests/csv-fixtures.test.ts` e `docs/5w2h-pr04-csv-validation.md`.
- **When (Quando):** Ciclo da entrega `codex/pr-04-csv-validation`.
- **Who (Quem):** Equipe Antigravity.
- **How (Como):** Parser RFC 4180 com streaming/buffers, consultas SQL com verificação de constraints e validação declarativa de schemas no Fastify.
- **How Much (Quanto Custa):** Custo nulo de infraestrutura; otimização do monólito modular existente.

---

## 2. Política de Fórmulas e Sanitização (CSV Injection)

| Etapa do Sistema | Tratamento do Campo | Exemplo de Entrada | Valor Gravado / Exportado | Justificativa |
|---|---|---|---|---|
| **Importação CSV** | Preservação Raw (sem alteração) | `=SUM(1+1)` | `=SUM(1+1)` | Mantém a integridade do dado inserido pelo usuário no banco de dados |
| **Importação CSV** | Preservação Raw (sem alteração) | `@cmd.exe` | `@cmd.exe` | Preserva textos e códigos legítimos de pacientes ou observações |
| **Exportação p/ Planilha** | Sanitização (`sanitizeCsvCell`) | `=SUM(1+1)` | `'=SUM(1+1)` | Impede execução maliciosa em softwares como Excel ou Google Sheets |

---

## 3. Testes & Cobertura
- `npm run typecheck`: 0 erros.
- `npm test`: 68 testes passados (100% de aprovação).
- `npm run build`: Build de produção executado com sucesso.
- `npm audit --audit-level=high`: 0 vulnerabilidades.

---

## 4. Plano de Rollback
- Reverter commit/merge da branch `codex/pr-04-csv-validation`.
- O banco de dados e as tabelas `csv_import_jobs` e `csv_import_errors` permanecem retrocompatíveis com a versão anterior.
