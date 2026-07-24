# Documentação 5W2H — Fronteiras de Ambiente, Quarentena e Storage de Anexos (PR-06)

## 1. Visão Geral (5W2H)

### What (O que)
Isolamento estrito entre os ambientes de Desenvolvimento (`local`), Demonstração (`demo`) e Produção (`s3`), suporte a scanners antivírus configuráveis (`DevAttachmentScanner`, `ClamAVAttachmentScanner` e `MockAttachmentScanner`), URLs assinadas com tempo de expiração curto e bloqueio absoluto de downloads de anexos em estado `quarantined` ou `failed`.

### Why (Por que)
Garantir que ambientes de produção nunca iniciem com armazenamento em disco local não persistente ou scanners de desenvolvimento baseados apenas em Magic Bytes, impedindo vazamento de dados de pacientes e protegendo a infraestrutura contra uploads infectados ou executáveis maliciosos.

### Who (Quem)
Desenvolvido pelo time de Arquitetura e Segurança da plataforma Fonolife.

### Where (Onde)
Nos arquivos `src/config.ts`, `src/domain/attachments.ts`, `src/app.ts` e na suíte de testes `tests/attachment-environment-boundary.test.ts`.

### When (Quando)
Janeiro de 2026 — Integração para a release de hardening de anexos clínicos (PR-06).

### How (Como)
1. **Startup Guard**: A função `validateAttachmentConfig` valida no boot da aplicação se `NODE_ENV=production` utiliza `s3` como `ATTACHMENT_STORAGE_PROVIDER` (exigindo `S3_BUCKET`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY`) e `clamav` como `ATTACHMENT_SCANNER_PROVIDER`.
2. **Scanner Antivírus**: A interface `AttachmentScanner` expõe `scan(data, declaredMime)` retornando status `clean | infected | failed`.
3. **Quarentena e Bloqueio**: Requisições de download (`/api/attachments/:id/download`) para anexos com status diferente de `ready` são rejeitadas com `403 Forbidden`.
4. **Health Check Triplo**: O endpoint `/api/health` avalia a saúde de DB, Storage e Scanner, respondendo `healthy`, `degraded` ou `unavailable`.

### How Much (Quanto)
Sem custos adicionais em ambiente local/demo (modo mock). Em produção, utiliza buckets S3 privados com suporte a criptografia e presigned URLs de curta duração (300 segundos por padrão).

---

## 2. Matriz de Configuração por Ambiente

| Ambiente | `ATTACHMENT_STORAGE_PROVIDER` | `ATTACHMENT_SCANNER_PROVIDER` | Validação no Startup |
| :--- | :--- | :--- | :--- |
| **Desenvolvimento (`local`)** | `local` | `dev` | Permite storage local e scanner de Magic Bytes |
| **Demonstração (`demo`)** | `demo` ou `s3` | `mock` ou `dev` | Exige isolamento e identifica ambiente demo |
| **Produção (`production`)** | `s3` | `clamav` | Bloqueia storage local e scanner dev; exige credenciais S3 |

---

## 3. Procedimento de Resposta a Incidentes (Quarentena)

1. Quando o scanner detecta um arquivo malicioso (`status = 'infected'`), a requisição de upload é rejeitada e o evento auditado em `audit_events`.
2. Caso um anexo entre em estado `quarantined`, a API recusa a geração de stream ou URL assinada.
3. A reconciliação de arquivos órfãos (`reconcileOrphanAttachments`) executa a varredura limpa de storage de maneira idempotente.

---

## 4. Plano de Rollback

1. Reverter os commits da branch `codex/pr-06-attachments-production-boundary`.
2. Restaurar `src/config.ts`, `src/domain/attachments.ts` e `src/app.ts`.
3. Reiniciar a aplicação.
