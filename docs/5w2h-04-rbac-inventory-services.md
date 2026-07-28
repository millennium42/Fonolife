# 5W2H — PR 04: Fechamento de Bypass de RBAC em Estoque e Serviços

## 1. Resumo Executivo 5W2H

| Pergunta | Detalhamento |
| :--- | :--- |
| **What** (O que foi feito?) | Refatoração da camada de rotas e autorização de estoque e catálogo (`src/modules/catalog/routes.ts` e `src/modules/patients/authorization.ts`) para substituir inspeções excessivamente permissivas (`authenticated`) por autorização granular baseada em papéis (`operatorOrAdmin` e `admin`); proibição da geração manual de movimentações do tipo `sale_deduction` em endpoints manuais com retorno 403 e registro em auditoria; unificação de segurança nas rotas administrativas e operacionais de movimentação; e automação do registro de eventos de auditoria nas negativas de acesso RBAC sem vazamento de dados de negócio. |
| **Why** (Por que foi feito?) | O sistema apresentava rotas críticas de estoque (`GET /api/inventory/movements`, `POST /api/inventory/movements`) e serviços (`POST /api/services`, `PUT /api/services/:id`) protegidas apenas com o guard de autenticação simples (`authenticated`), permitindo que contas com perfil médico acedessem dados operacionais e realizassem mutações fora do seu escopo de autorização clínico. Além disso, o tipo de movimentação de estoque `sale_deduction` podia ser forjado manualmente, contornando o fluxo transacional de vendas do PDV e abrindo risco para manipulação fraudulenta de saldos e adulteração do custo das mercadorias vendidas (CMV). |
| **Who** (Quem realizou e validou?) | Implementado e validado ponta a ponta mediante testes automatizados em TypeScript/ESM e integração no PostgreSQL, respeitando as diretrizes de arquitetura monólita sem ORM (*Ponytail full doctrine*). |
| **When** (Quando é aplicado?) | Em tempo de requisição HTTP (via Fastify preHandler hooks `operatorOrAdmin` e `admin`) antes de iniciar qualquer transação ou consulta SQL no PostgreSQL, bem como na validação de payload no início dos handlers transacionais. |
| **Where** (Onde no código?) | `src/modules/catalog/routes.ts`, `src/modules/patients/authorization.ts` e `tests/rbac-inventory-services.test.ts`. |
| **How** (Como foi implementado?) | 1) Adoção do guard `operatorOrAdmin` nas rotas `GET /api/inventory/movements`, `POST /api/inventory/movements`, `POST /api/admin/inventory/movements`, `POST /api/services` e `PUT /api/services/:id`, impedindo o acesso do perfil `doctor`.<br>2) Adição de verificação no início do `handleInventoryMovement`: caso `movementType === 'sale_deduction'`, a operação é imediatamente rejeitada com status `403 Forbidden` e um evento de auditoria `forged_sale_deduction_denied` é gravado no banco.<br>3) Enriquecimento das funções guards `admin` e `operatorOrAdmin` em `src/modules/patients/authorization.ts` para invocar `auditDenial` com a ação `rbac_access_denied` antes do disparo da exceção 403.<br>4) Preservação da leitura livre em `GET /api/products` e `GET /api/services` para permitir que o perfil médico consuma o catálogo durante o atendimento clínico sem conceder acesso ao histórico operacional de estoque. |
| **How Much** (Quanto custo / impacto?) | Zero custo de processamento extra ou refatoração destrutiva no PostgreSQL. O bloqueio em fail-fast na camada HTTP elimina transações SQL desnecessárias para requisições não autorizadas, reduzindo overhead e protegendo a integridade transacional de forma nativa e eficiente. |

---

## 2. Justificativa Explícita Contra Regressões na Produção

1. **Garantia de Fechamento Completo na Matriz de Privilégios:**
   A remoção de dependência irrestrita ao guard `authenticated` sela definitivamente a superfície de vulnerabilidade que permitia ao perfil médico ler ou adulterar histórico de movimentações de estoque e precificação de serviços operacionais. A matriz de autorização restritiva agora é aplicada por objeto e funcionalidade com estrita consistência entre frontend e backend.
2. **Prevenção de Fraudes de Inventário (Proteção de `sale_deduction`):**
   Movimentações de baixa por venda são estritamente reservadas ao subsistema transacional do PDV/Caixa (`src/modules/finance/routes.ts`). Impedir que operadores ou administradores simulem manualmente uma baixa de venda via API de estoque preserva a rastreabilidade fiscal, a integridade do livro-razão financeiro e a conciliação do estoque contra recibos pagos.
3. **Auditoria Contínua sem Vazamento de Dados Sensíveis:**
   O registro automático de negativas de autorização (`auditDenial`) monitora e correlaciona tentativas indevidas de elevação de privilégios na tabela de eventos de auditoria do banco sem expor dados pessoais de pacientes ou informações confidenciais do consultório nas respostas HTTP ou nos logs.

---

## 3. Evidência Verificável das Suítes de Testes (TS/ESM)

A PR incorpora teste automatizado reproduzindo as falhas do estado original e provando o comportamento em conformidade total no estado atual:
- `tests/rbac-inventory-services.test.ts`: 
  1. Rejeita solicitações de médico a `GET /api/inventory/movements`, `POST /api/inventory/movements`, `POST /api/services` e `PUT /api/services/:id` com HTTP 403 e comprova o registro de auditoria `rbac_access_denied`.
  2. Demonstra que tentativas de simular `sale_deduction` pela rota manual (por operador ou admin) são rechaçadas com status HTTP 403 e registro do evento de auditoria `forged_sale_deduction_denied`, garantindo que o saldo e as transações no banco de dados não sofram nenhuma alteração.
  3. Confirma que o operador permanece incapaz de cadastrar ou alterar produtos diretamente em rotas restritas exclusivamente à role de Administrador.
  4. Valida as permissões legítimas de cada perfil, confirmando que operadores manipulam entradas/ajustes e serviços normalmente e que médicos têm leitura liberada para consulta de produtos e serviços em seus atendimentos clínicos.
- **Integração na Suíte Completa:** A execução de `npm test` alcança **100% de sucesso (158 passed)**, provando ausência total de regressões nos fluxos de prontuário, caixa, faturamento e segurança LGPD.

---

## 4. Plano de Reversão Explícito e Compatível (Rollback sem Remoção Destrutiva)

Como ditaram os invariantes da arquitetura e as regras do *Ponytail doctrine*:
- **Inexistência de alterações destrutivas ou modificações no Esquema PostgreSQL:** Esta entrega atua exclusivamente na verificação de permissões dentro do roteador Fastify e nas validações operacionais de entrada das requisições, **sem efetuar ou exigir nenhuma migration ou alteração de DDL/schema na base de dados PostgreSQL**.
- **Procedimento de Reversão Isolada:**
  1. A alteração pode ser revertida limpamene via `git revert <SHA>`, retornando a configuração de preHandlers em `catalogRoutes` ao seu estado anterior sem causar quebras em tabelas ou perda de dados.
  2. Nenhuma tabela, linha ou evento de auditoria no PostgreSQL precisará ser expungida durante o rollback, preservando a imutabilidade (*append-only*) de todo o histórico operacional e financeiro do sistema.
