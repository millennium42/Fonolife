# Guia de desenvolvimento com IA
**Repositório:** millennium42/Fonolife  
**Revisão histórica:** 41 commits, do commit inicial 68c033b até a412d5e  
**Data da revisão:** 23 de julho de 2026  
**Método:** inspeção do histórico, diffs, migrations, rotas, domínio, frontend, testes e configuração de deploy. Esta revisão não substitui a execução local da suíte nem uma auditoria jurídica ou de segurança independente.

---

## 1. Objetivo
Este documento define como desenvolver o Fonolife com apoio de IA sem comprometer dados clínicos, integridade financeira, estoque, auditoria, LGPD ou estabilidade operacional.

A IA deve ser usada como assistente de investigação, implementação e revisão. Ela não deve decidir sozinha regras clínicas, bases legais, retenção de prontuários, permissões de acesso ou alterações irreversíveis.

---

## 2. Resumo da arquitetura atual
O Fonolife é um monólito TypeScript com:
- **React/Vite** no frontend;
- **Fastify** na API;
- **PostgreSQL** e SQL direto por meio de `pg`;
- **Migrations SQL** ordenadas e verificadas por checksum;
- **Autenticação por sessão opaca** armazenada por hash;
- **Auditoria append-only**;
- Módulos de pacientes, acompanhamento, vendas, financeiro, estoque, serviços, médicos, anexos, WhatsApp e privacidade;
- Deploy no Render e ambiente local por Docker Compose.

A escolha de monólito modular é adequada ao tamanho atual. O principal problema arquitetural não é o monólito, mas a concentração de muitas rotas e regras de orquestração em `src/app.ts` e de muitas telas em `web/src/main.tsx`.

---

## 3. Invariantes que nenhuma IA pode quebrar
1. Dados clínicos reais, credenciais, documentos e identificadores de pacientes não entram em prompts, logs ou exemplos.
2. Lançamentos financeiros realizados são append-only. Correções usam compensações vinculadas ao original.
3. Movimentações de estoque são append-only e precisam ser idempotentes.
4. Migrations já aplicadas nunca são editadas; uma nova migration aditiva ou corretiva deve ser criada.
5. Toda mutação relevante grava auditoria na mesma transação do efeito principal.
6. Dinheiro permanece em centavos inteiros no banco e não pode perder precisão no JavaScript.
7. Um profissional de saúde só acessa pacientes e prontuários autorizados.
8. Arquivos clínicos permanecem privados, autenticados, autorizados, verificados e armazenados de forma durável.
9. Operações irreversíveis exigem reautenticação, justificativa, confirmação explícita e trilha de aprovação.
10. Testes de texto-fonte não substituem testes HTTP, PostgreSQL e E2E.

---

## 4. Problemas prioritários e soluções propostas

### P0 — Corrigir antes de tratar o sistema como produção

#### 4.1 Ambiente de produção em modo demonstração
- **Problema:** `render.yaml` combina `NODE_ENV=production` com `DEMO_MODE=true`. O seed automático cria contas com senhas conhecidas e a interface oferece login com um clique.
- **Risco:** Acesso não autorizado a um ambiente publicado e mistura de dados demonstrativos com dados reais.
- **Solução:**
  - Definir `DEMO_MODE=false` no Blueprint de produção;
  - Remover credenciais e botões demo do bundle de produção por variável de build ou endpoint de configuração pública;
  - Impedir o start quando `NODE_ENV=production && DEMO_MODE=true`, salvo em uma aplicação separada e explicitamente identificada como demonstração;
  - Criar o primeiro administrador por comando único, segredo temporário e troca obrigatória de senha;
  - Separar banco, domínio e serviço Render da demonstração.

#### 4.2 Anonimização incompatível com a imutabilidade de eventos
- **Problema:** A anonimização executa `UPDATE patient_events SET description=...`, mas `patient_events` recebeu anteriormente um trigger que rejeita `UPDATE` e `DELETE`.
- **Risco:** A transação de anonimização tende a falhar integralmente. A interface pode oferecer uma operação que não funciona no banco real.
- **Solução:**
  - Não remover silenciosamente a imutabilidade;
  - Substituir a alteração do evento por uma camada de redação/pseudonimização na leitura;
  - Alternativamente, armazenar PII separada e criptografada, permitindo destruição controlada da chave sem alterar o evento clínico;
  - Criar teste de integração PostgreSQL que execute a anonimização completa;
  - Revisar com responsável jurídico quais dados devem ser preservados por obrigação clínica, fiscal ou regulatória.

#### 4.3 Autorização por objeto insuficiente
- **Problema:** Várias rotas usam apenas `authenticated`, incluindo listagem/download de anexos, exportação LGPD e rotas gerais de paciente. Após a introdução do papel `doctor`, isso permite que um usuário autenticado tente acessar objetos por UUID fora do seu vínculo.
- **Risco:** BOLA/IDOR, com exposição de prontuários, anexos e dados pessoais.
- **Solução:**
  - Criar políticas centrais como `canReadPatient`, `canWritePatient`, `canExportPatientData` e `canReadAttachment`;
  - Aplicar a política em todas as rotas, não somente na interface;
  - Para médico, exigir `responsible_doctor_id = currentUser.id` ou vínculo clínico explícito;
  - Registrar tentativas negadas em auditoria sem incluir conteúdo clínico;
  - Adicionar testes de matriz de acesso Admin × Operador × Médico × paciente vinculado/não vinculado.

---

### P1 — Alta prioridade técnica

#### 4.4 Armazenamento de anexos local, síncrono e não transacional
- **Problemas:** Uso de `writeFileSync`/`readFileSync`, arquivo gravado antes da validação transacional, confiança no MIME informado pelo cliente, base64 em JSON e diretório local no Render.
- **Riscos:** Bloqueio do event loop, arquivos órfãos, conteúdo malicioso, uso excessivo de memória e perda de arquivos em filesystem efêmero ou em múltiplas instâncias.
- **Solução:** Usar storage privado S3-compatível, upload multipart/streaming, verificação de magic bytes, antivírus/quarentena, limite no proxy e no Fastify, chave de objeto gerada pelo servidor, metadados no banco e URLs assinadas de curta duração. Implementar compensação/cleanup quando banco ou storage falhar.

#### 4.5 Arquivos centrais excessivamente grandes
- **Problema:** `src/app.ts` concentra milhares de linhas e `web/src/main.tsx` concentra boa parte da interface.
- **Risco:** Conflitos de merge, regressões cruzadas, contexto excessivo para IA e revisão humana superficial.
- **Solução:** Manter o monólito, mas dividir por módulos (`auth`, `patients`, `follow-ups`, `sales`, `finance`, `inventory`, `services`, `doctors`, `attachments`, `privacy`). Cada módulo deve possuir `routes.ts`, `schemas.ts`, `service.ts`, `repository.ts` (quando necessário) e testes próprios. No frontend, separar páginas, componentes, hooks e cliente de API.

#### 4.6 Validação de entrada inconsistente
- **Problema:** Diversos UUIDs, datas, enums e relacionamentos são enviados diretamente ao PostgreSQL. Expressões regulares permissivas e casts SQL podem produzir erro 500 em vez de 400/404/409.
- **Solução:** Adotar schemas Fastify com TypeBox ou Zod; validar UUID RFC 4122, data civil real, enums, limites, strings e inteiros seguros; mapear erros de FK, unique e check constraint para Problem Details previsível.

#### 4.7 Precisão de valores financeiros
- **Problema:** Colunas `bigint` são convertidas com `Number(...)` em algumas respostas.
- **Risco:** Perda de precisão acima de `Number.MAX_SAFE_INTEGER`.
- **Solução:** Definir um codec único de dinheiro. A API deve serializar centavos como string decimal ou validar rigorosamente que o valor está no intervalo seguro. Nunca misturar formatos por endpoint.

#### 4.8 Concorrência em financeiro e estoque
- **Problema:** Verificações `SELECT` antes de `INSERT`, saldo calculated por soma e deduções automáticas podem sofrer corrida quando duas requisições chegam simultaneamente.
- **Solução:** Bloquear a entidade correta (`FOR UPDATE`), usar chaves idempotentes e constraints únicas. Uma baixa de parcela precisa de unicidade operacional; uma baixa de estoque por venda/serviço precisa guardar `sale_id` ou `service_execution_id` e impedir duplicação no banco.

#### 4.9 Parser CSV artesanal
- **Problemas:** Divisão por linha não suporta campos multilinha entre aspas; detecção de delimitador pode interpretar `;` dentro de uma célula; aspas não balanceadas não são rejeitadas; datas são verificadas apenas por formato; a sanitização de fórmula altera dados durante importação.
- **Solução:** Usar parser RFC 4180 mantido e streaming; definir schema e versão de importação; validar cabeçalhos duplicados/ausentes/extras; validar datas reais, UUID e existência de CNPJ/conta; aplicar proteção contra fórmula somente ao exportar planilha; calcular idempotência com `entityType` + `parserVersion` + conteúdo canônico.

#### 4.10 Rate limit e sessão
- **Problema:** Tentativas de login ficam em um `Map` local por processo. Isso não funciona de modo consistente em múltiplas instâncias, reinicia a cada deploy e pode crescer sem limite.
- **Solução:** Usar plugin de rate limit com armazenamento Redis/PostgreSQL, chave combinando IP e identificador normalizado, expiração automática e métricas. Criar rotina de limpeza de sessões expiradas e opção de revogar todas as sessões após troca de senha.

---

### P2 — Melhorias planejáveis
- Paginação por cursor em listas hoje limitadas a 200/500 registros;
- Visual regression para 360, 768 e 1440 px, evitando que `overflow-x` apenas esconda defeitos;
- Remover artefatos Graphify volumosos e caminhos locais do histórico; publicar relatório como artefato da CI;
- Separar seed estrutural, seed de testes e seed demonstrativo;
- Adicionar observabilidade de erros, duração de consultas, importações e filas;
- Documentar política de retenção e descarte de anexos;
- Adicionar ADRs para decisões de auditoria, anonimização, dinheiro e estoque.

---

## 5. Análise commit a commit

| Nº | Commit | Mudança principal | Problema ou risco observado | Ação recomendada |
|---|---|---|---|---|
| 1 | `68c033b` | Inicializa a main sem código. | Nenhum problema funcional. | Manter como marco auditável. |
| 2 | `3f9e6cc` | Cria de uma vez autenticação, banco, API, frontend, Docker, CI e documentação. | Commit grande; origem do arquivo central; rate limit local e validações dispersas. | Dividir entregas futuras e modularizar sem migrar para microserviços. |
| 3 | `0d2db0f` | CRM, pacientes, eventos e optimistic locking. | Sem paginação; FKs/datas podem chegar sem validação; acesso inicialmente amplo. | Schemas de entrada, autorização por paciente e paginação. |
| 4 | `ff35345` | Fila de follow-up e tarefas imutáveis. | Não há fluxo explícito de reagendamento nem responsável por tarefa. | Cancelar e recriar com vínculo `supersedes_task_id`; adicionar assignee. |
| 5 | `a740db5` | Vendas, parcelas, ledger e D+7/D+30/D+90. | Concorrência de recebimentos; mistura grande de formatação e função; produto textual vira fonte paralela ao catálogo. | Constraint/idempotência, serviço transacional e snapshot consistente do produto. |
| 6 | `2dd873d` | Financeiro consolidado para dois CNPJs. | Datas/UUID/filtros pouco validados, bigint convertido para Number, limite fixo. | Codec de dinheiro, schemas e paginação por cursor. |
| 7 | `a56a353` | Dashboard operacional. | Contadores incluem tarefas de pacientes arquivados, enquanto a fila os exclui. | Uma CTE/base única para cards e lista; teste com paciente arquivado. |
| 8 | `0e1c4ad` | QA, Playwright, axe, Docker e publicação GHCR. | Alguns testes verificam texto-fonte em vez de comportamento; CI sem cancelamento de execuções antigas. | Priorizar integração real e configurar concurrency no workflow. |
| 9 | `4de92ce` | Geração Graphify. | Artefatos gerados criam ruído e podem registrar caminho local. | Gerar na CI e publicar como artifact; versionar apenas resumo útil. |
| 10 | `98e15b2` | Importação CSV idempotente. | Parser não é RFC 4180 completo; hash não incorpora claramente entidade/versão; sanitização altera entrada. | Parser mantido, streaming, schema versionado e hash contextual. |
| 11 | `bb925aa` | Catálogo e estoque append-only. | Sinal da quantidade não é garantido por tipo no banco; falta vínculo idempotente da baixa à venda. | CHECK por tipo/sinal, `sale_id` e índice único parcial. |
| 12 | `5ccde91` | Atalhos WhatsApp com auditoria. | Clique não prova envio; trecho da mensagem é duplicado no histórico. | Registrar `link_opened`, template ID e confirmação manual de envio. |
| 13 | `a7b6a8a` | Validação de anexos. | MIME é declarado pelo cliente; sanitização não é inspeção de conteúdo. | Magic bytes, antivírus e nome interno gerado. |
| 14 | `c067885` | Migration de anexos. | Índices descritos como parciais não são parciais; faltam status de scan/storage e arquivador. | Migration corretiva com metadados operacionais e retenção. |
| 15 | `9c8e9de` | Upload, download e arquivamento de anexos. | I/O síncrono, arquivo órfão, base64, filesystem local e autorização insuficiente. | Storage privado, streaming, compensação e policy por paciente. |
| 16 | `7fdb702` | UI de anexos. | Base64 aumenta memória e payload; sem progresso/cancelamento. | Multipart ou upload direto assinado. |
| 17 | `ee6a73e` | Domínio de privacidade e exportação. | Pseudônimo usa parte do UUID e continua linkável; tipos any; pacote não inclui arquivos. | Token aleatório/HMAC protegido, DTO explícito e pacote de portabilidade definido. |
| 18 | `077b08e` | Campo `anonymized_at`. | Metadado isolado não representa pedido, base legal, aprovação ou escopo. | Tabela de `privacy_requests` e decisões de retenção. |
| 19 | `0687af4` | Endpoints de exportação e anonimização. | Atualiza tabela imutável; exportação acessível a qualquer autenticado; anonimização incompleta de PII. | Redesenhar fluxo, políticas de acesso e teste PostgreSQL real. |
| 20 | `639a914` | Botões LGPD na ficha. | Ação irreversível exposta como botão administrativo simples. | Reautenticação, justificativa, preview, dupla aprovação e legal hold. |
| 21 | `d13f663` | Primeiro ajuste de overflow mobile. | Overflow global pode mascarar componente defeituoso. | Tratar overflow em tabela/nav específica e usar screenshots de regressão. |
| 22 | `75e42fd` | Segundo ajuste mobile. | `word-break` e empilhamento globais podem degradar nomes, códigos e navegação. | CSS por componente e menu mobile acessível. |
| 23 | `3a29c99` | Blueprint Render, SSL e origem externa. | Mudança de deploy misturada a artefatos gerados; filesystem local de anexos não é tratado. | Teste de deploy efêmero e storage externo antes de produção. |
| 24 | `557b254` | Corrige sintaxe do Blueprint. | Configuração inválida só foi encontrada após commit anterior. | Validar `render.yaml` na CI ou em ambiente preview. |
| 25 | `b5a2180` | Move ferramentas de build para dependencies. | Aumenta dependências/runtime sem necessidade, enquanto o build já instala dev dependencies. | Manter ferramentas em `devDependencies` e usar build separado/multi-stage. |
| 26 | `e5a9115` | Login demo com um clique. | Credenciais fixas entram no frontend. | Compilar somente para ambiente demo isolado. |
| 27 | `a372040` | Seed demo automático quando `users` está vazia. | Cria contas conhecidas em produção e força `DEMO_MODE=true` no Render. | Remover imediatamente do deploy de produção; bootstrap seguro e manual. |
| 28 | `5fe1e04` | Papel médico, agenda e prontuário vinculado. | A nova role amplia a superfície, mas rotas antigas continuam apenas autenticadas. | Revisão completa de autorização por objeto e criação administrativa de médicos. |
| 29 | `264533a` | Serviços, CMV e API. | Catálogo mutável pode alterar leitura histórica; risco de validação/concurrency do consumo. | Snapshot de preço/CMV/insumos na execução e chave idempotente. |
| 30 | `d7896dd` | Merge da branch de serviços. | Merge não adiciona requisito próprio e pode ocultar revisão do diff acumulado. | PR com checks, descrição de invariantes e merge commit apenas após aprovação. |
| 31 | `b0009ad` | Médico responsável e baixa automática de insumos. | Baixa automática exige atomicidade, saldo não negativo e proteção contra retry. | Executar tudo em uma transação, lock do produto e unicidade por execução. |
| 32 | `91c499c` | Merge do prontuário global. | Mesmo risco de revisão acumulada de merge. | Conferir matriz de acesso e migrations no PR antes do merge. |
| 33 | `864030b` | Caixa PDV, prontuário global e relatório financeiro. | Commit agrega três domínios e amplia muito o frontend; risco de regra financeira apenas na UI. | Separar por domínio e garantir que cálculo/validação estejam na API/banco. |
| 34 | `9cabae8` | Merge do PDV. | Pode duplicar ou esconder mudanças se branch não estiver atualizada. | Exigir branch atualizada, CI verde e revisão do merge-base. |
| 35 | `9bcad1d` | Seed demonstrativo realista. | Dados “realistas” podem parecer reais e FKs fixas tornam o seed frágil. | Marcar tudo como sintético, usar namespace e resolver IDs retornados pelo banco. |
| 36 | `53e373d` | Merge de design/seed. | Merge de UI e dados dificulta rollback independente. | Separar mudanças visuais de fixtures. |
| 37 | `552fbd9` | Atualização final Graphify. | Churn grande sem mudança funcional. | Artifact de CI, não commit de produto. |
| 38 | `e6906b3` | Corrige FKs do seed com IDs existentes. | Confirma fragilidade do seed anterior e dependência em IDs determinísticos. | Upserts com `RETURNING id`, transação e testes em banco vazio e parcialmente preenchido. |
| 39 | `bacc003` | Merge da correção do seed. | Nenhum risco novo além do processo. | Manter teste de idempotência no CI. |
| 40 | `23a1618` | Atalhos demo para três perfis. | Amplia exposição de credenciais conhecidas. | Habilitar somente em build demo e exibir banner permanente “dados fictícios”. |
| 41 | `a412d5e` | Merge final dos atalhos demo. | A main publicada mantém o comportamento demo. | Separar imediatamente demo e produção. |

---

## 6. Fluxo obrigatório para desenvolvimento com IA

### Etapa 1 — Preparar o contexto
Forneça à IA somente:
- Objetivo e critério de aceite;
- Arquivos estritamente relacionados;
- Contratos de API e schema sem dados reais;
- Invariantes relevantes;
- Testes existentes;
- Restrições de segurança, LGPD, concorrência e rollback.

*Não entregue o repositório inteiro sem necessidade. Contexto excessivo reduz precisão e favorece alterações laterais.*

### Etapa 2 — Solicitar investigação antes de código
**Prompt recomendado:**
> Analise a tarefa sem editar arquivos. Identifique fluxo atual, tabelas, rotas, regras, testes, riscos de autorização, concorrência, LGPD e rollback. Liste os arquivos mínimos que precisariam mudar e as dúvidas verificáveis. Não proponha microserviços nem abstrações especulativas.

### Etapa 3 — Exigir plano verificável
O plano deve declarar:
- Comportamento atual e comportamento esperado;
- Invariantes preservados;
- Migration necessária ou não;
- Transação e estratégia de idempotência;
- Matriz de autorização;
- Testes unitários, integração e E2E;
- Rollback e compatibilidade com dados existentes.

### Etapa 4 — Implementação em mudanças pequenas
Uma entrega deve preferir esta ordem:
1. Schema / migration;
2. Domínio puro;
3. Repository / service transacional;
4. Rota e schema HTTP;
5. Cliente / API do frontend;
6. Componente visual;
7. Testes;
8. Documentação.

*Não misture formatação ampla, Graphify, seed e funcionalidade no mesmo commit.*

### Etapa 5 — Revisão adversarial independente
Use uma segunda sessão/agente sem mostrar a justificativa do implementador:
> Revise este diff como adversário técnico. Procure regressões, BOLA/IDOR, SQL ou filesystem não transacional, corrida, retry duplicado, perda de precisão, PII em logs, migration irreversível, inconsistência entre UI/API/banco e testes que verificam implementação em vez de comportamento. Classifique P0/P1/P2.

### Etapa 6 — Executar validações
**Mínimo geral:**
```bash
npm ci
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
docker compose up --build --wait
npm run test:e2e
```
**Além disso:**
- Rodar migrations duas vezes;
- Rodar seed duas vezes em banco vazio e parcialmente populado;
- Testar concorrência em baixa financeira e estoque;
- Testar cada papel em objeto permitido e proibido;
- Testar rollback por nova migration corretiva, nunca apagando histórico;
- Validar 360, 768 e 1440 px sem depender apenas de `scrollWidth`.

---

## 7. Matriz mínima de testes por domínio

| Domínio | Testes indispensáveis |
|---|---|
| **Autenticação** | Senha inválida, rate limit, cookie, logout, expiração, revogação após troca de senha |
| **Pacientes** | Optimistic lock, arquivamento, acesso médico vinculado/não vinculado, paginação |
| **Follow-up** | Hoje/atrasado/fuso, reagendamento, paciente arquivado, encerramento único |
| **Vendas** | Idempotência, soma exata, cancelamento, concorrência e geração única de tarefas |
| **Financeiro** | Baixa simultânea, estorno, precisão, dois CNPJs, RBAC e filtros inválidos |
| **Estoque** | Baixa simultânea, saldo zero, retry, sinal por movimento e reconciliação com venda/serviço |
| **CSV** | Aspas, delimitadores, multiline, BOM, encoding, cabeçalho duplicado, retry e arquivo grande |
| **WhatsApp** | Telefone inválido, template, clique sem envio, ausência de texto clínico no audit log |
| **Anexos** | BOLA, magic bytes, arquivo malicioso, tamanho, storage indisponível, cleanup e URL expirada |
| **LGPD** | Autorização, legal hold, exportação completa, anonimização idempotente e compatibilidade com triggers |
| **Médico** | Agenda por período, conflito, paciente vinculado, prontuário imutável e acesso negado |
| **Seed** | Banco vazio, parcial, reexecução, IDs existentes, modo produção e dados exclusivamente sintéticos |

---

## 8. Convenção de commits e PRs assistidos por IA

### Commit
```text
<tipo>(<módulo>): <resultado observável>

Contexto:
Implementação:
Invariantes:
Testes executados:
Riscos conhecidos:
Rollback:
Uso de IA: ferramenta e escopo, sem dados sensíveis.
```
*Evite mensagens que afirmem “zero riscos” apenas porque testes unitários passaram. Um teste verde não comprova ausência de falha de autorização, concorrência ou deploy.*

### Pull Request
Todo PR deve conter:
- Critério de aceite verificável;
- Diagrama ou descrição do fluxo alterado;
- Migration e plano de compatibilidade;
- Matriz de autorização;
- Evidências de testes;
- Screenshot apenas quando UI mudar;
- Riscos P0/P1/P2;
- Rollback;
- Confirmação de que nenhum dado real foi fornecido à IA.

---

## 9. Prompts úteis

### Implementar endpoint
> Implemente o endpoint descrito usando o padrão modular do Fonolife. Crie schema de entrada e saída, política de autorização por objeto, service transacional, auditoria atômica e testes HTTP com PostgreSQL real. Mapeie FK/unique/check para Problem Details. Não adicione lógica crítica apenas na UI.

### Criar migration
> Crie uma migration aditiva e idempotente. Não altere migrations anteriores. Analise lock, dados existentes, backfill, constraint NOT VALID/VALIDATE quando aplicável, índices concorrentes quando necessário e compatibilidade com rollback por migration corretiva.

### Alterar financeiro/estoque
> Modele retry e concorrência antes do código. Defina chave idempotente, lock, constraint única e vínculo ao evento de origem. Demonstre que duas requisições simultâneas não geram dois lançamentos nem saldo negativo.

### Revisar segurança clínica
> Construa a matriz sujeito-ação-objeto. Teste Admin, Operador e Médico em paciente próprio e alheio. Procure BOLA em IDs de rota, anexos, exportações, timeline, consultas e relatórios. Não confie em ocultação de botões no frontend.

---

## 10. Definition of Done (DoD)
Uma tarefa só está pronta quando:
1. O comportamento foi testado, não apenas o texto do código;
2. A autorização foi testada no backend;
3. Retry e concorrência foram analisados;
4. Migrations são aditivas e repetíveis;
5. Auditoria está na mesma transação;
6. Não há PII em logs/prompts;
7. Dinheiro e estoque preservam precisão e integridade;
8. Documentação e contratos foram更新 (atualizados);
9. O diff é pequeno o suficiente para revisão humana;
10. A IA não deixou comentários, arquivos gerados ou abstrações sem uso;
11. Há rollback claro;
12. A revisão independente não encontrou P0/P1 aberto.

---

## 11. Ordem recomendada de correção
1. Desativar demo no ambiente de produção e remover login de um clique do build produtivo.
2. Corrigir a anonimização incompatível com `patient_events` imutável.
3. Implementar autorização por objeto em pacientes, anexos, exportação e prontuários.
4. Migrating anexos para storage privado durável e streaming seguro.
5. Modularizar `src/app.ts` e `web/src/main.tsx` gradualmente, sem reescrita total.
6. Padronizar schemas, Problem Details e codec de dinheiro.
7. Fortalecer concorrência/idempotência de financeiro, estoque e serviços.
8. Substituir parser CSV artesanal.
9. Refatorar seed e separar demonstração, teste e produção.
10. Mover artefatos Graphify para a CI e reduzir churn do repositório.

---
*Este guia deve ser atualizado sempre que uma nova role, tipo de dado sensível, integração externa, operação irreversível ou invariante financeira/estoque for introduzida.*
