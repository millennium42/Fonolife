# 5W2H e Relatório Final: Armazenamento S3 Real e Persistente (PR-01)

## 1. Identidade da Entrega
- **Repositório:** `millennium42/Fonolife`
- **Branch:** `fix/01-real-s3-attachment-storage`
- **Tipo de Trabalho:** Correção de bug arquitetural e endurecimento técnico (Hardening/Security & Durability)
- **Data:** 28/07/2026

---

## 2. Documentação 5W2H

### What (O que foi feito?)
Substituição da implementação simulada in-memory (`Map` volátil com URLs geradas localmente) da classe `S3AttachmentStorage` pelo cliente oficial `@aws-sdk/client-s3` (SDK v3) e `@aws-sdk/s3-request-presigner`, acompanhada do isolamento dos ambientes de teste/demo por meio do novo adapter `InMemoryAttachmentStorage` e estrita quarentena no startup para produção.

### Why (Por que foi feito?)
Para garantir a durabilidade e segurança no armazenamento de laudos, relatórios exames e documentos clínicos de pacientes conforme o contrato técnico e regulatório do sistema (LGPD e CFM/TISS). A simulação anterior impedia a persistência transacional entre instâncias (clustering/balanceamento), violava requisitos de retenção e retornava assinaturas falsas (`signature=mock`), além de mascarar indisponibilidades de infraestrutura.

### Where (Onde foram realizadas as alterações?)
- `src/domain/attachments.ts`: Implementação integral dos métodos `save`, `getStream`, `delete`, `exists`, `getSignedUrl` e `health` em `S3AttachmentStorage` utilizando AWS SDK v3. Criação de `InMemoryAttachmentStorage` e reforço no tratamento de falhas sem `catch {}` vazio.
- `src/config.ts`: Quarentena de ambiente que bloqueia a inicialização (`validateAttachmentConfig`) em `production` se o provedor for diferente de `s3` ou se houver tentativa de uso de memória/demo/local. Suporte explícito ao provider chain do IAM de produção.
- `src/app.ts`: Injeção de dependências alinhada, repassando todas as variáveis operacionais (`S3_REGION`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, credenciais) para o S3 e alternando para `InMemoryAttachmentStorage` somente em modo `demo` ou `test`.
- `src/modules/attachments/routes.ts`: Aprimoramento da compensação de transação com log de falha de remoção no storage ao ocorrer erro de gravacão no PostgreSQL, além de distinção explícita entre erro `404` (arquivo não encontrado) e `503` (storage indisponível).
- `src/modules/health/routes.ts`: Adote do método `health()` com respeito ao SLA operacional: status `down` e indisponibilidade global ante a inexistência de bucket ou falha de credenciais, além do detalhamento explicito no `/api/config`.

### When (Quando e em que contexto?)
Implementado durante o ciclo de hardening pré-produção do Fonolife em 28/07/2026, sucedendo as revisões P0 fundamentais do sistema e antecipando o provisionamento em containers escaladas ou clusterizados em nuvens AWS / compatíveis com MinIO.

### Who (Quem executou e validou?)
- **Execução:** Google Antigravity (IA Agent / Engenharia de Plataforma).
- **Metodologia:** Ponytail doctrine, estrita atomicidade em commits programados (`test`, `fix`, `test`) e validação via suíte analítica baseada no `m1nd-operator` / `graphify`.

### How (Como foi implementado e validado?)
1. **Fase de Reprodução:** Criação de `tests/s3-real-storage-repro.test.ts` comprovando a falha original do mock in-memory ante a exigência de persistência entre instâncias separadas e URL assinada.
2. **Fase de Implementação:** Migração para as bibliotecas oficiais, refatoração de contratos sem quebras para o consumidor `AttachmentStorage`, eliminação do `mockMode` da classe S3 e padronização das chamadas criptográficas V4.
3. **Fase de Regressão:** Introdução de `tests/s3-real-storage-regressions.test.ts` cobindo ciclo completo, verificação de hash idêntico, simulação de credenciais revogadas, bucket inexistente e rejeição a provedores intrusivos em produção.

### How much (Qual o custo e impacto computacional/operacional?)
- **Impacto no bundle/memória:** Baixíssimo; o AWS SDK v3 é importado em módulos (`@aws-sdk/client-s3`), mantendo a leveza do microserviço modular sem ORM e com baixo footprint. Em `production`, a memória RAM é poupada pois os anexos deixam de transitar pela heap via `Map` e são servidos/gravados sob streams controlados de I/O.
- **Risco:** Zero de quebra funcional de regressão no módulo de anexos (126 testes de integração e unidade automatizados em estado verde).

---

## 3. Matriz de Compatibilidade e Quarentena de Ambientes

| Ambiente (`APP_ENV`) | Provedor Permitido | Classe Implementadora | Comportamento de Falha no Startup |
| :--- | :--- | :--- | :--- |
| **`production`** | `s3` (obrigatório) | `S3AttachmentStorage` (SDK v3) | Aborta execução se tentado `demo`, `local`, `memory` ou se ausentes credenciais/bucket sem provider chain IAM. |
| **`demo` / `test`** | `demo` / `memory` / `s3` | `InMemoryAttachmentStorage` ou `S3AttachmentStorage` (real) | No modo `demo`, isola arquivos na heap em tempo de execução sem afetar disco ou buckets da nuvem. |
| **`development`** | `local` / `s3` / `memory`| `LocalAttachmentStorage`, S3 ou InMemory | Flexibilidade para ambiente local sem exigir credenciais reais em desenvolvimento rápido. |

---

## 4. Plano de Rollback e Riscos

- **Procedimento de Reversão:**
  1. Em caso de anomalia de infraestrutura externa impossibilitando requisições ao provedor S3 no momento do deploy, o rollback se resume ao git revert desta branch (`git revert b6424e9 17b2a1d ...`).
  2. Como o esquema do PostgreSQL (`table patient_attachments`) **não** foi alterado nesta PR, não há necessidade de rollback ou migração destrutiva de banco de dados (`down migrations`).
- **Mitigação de Indisponibilidade Transitória:**
  - O sistema passa a responder `503 Service Unavailable` em rotas de download/preview e health check informando explicitamente falha transitória ou indisponibilidade de infraestrutura, prevenindo exclusão errônea de metadados clínicos.
