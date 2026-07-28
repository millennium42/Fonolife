# 5W2H — Tornar Login, Sessão e Logout Fail-Closed e Transacionais (Prompt 07)

## Diagnóstico do Estado Anterior
No ciclo de vida de autenticação, identificaram-se fragilidades estruturais e quebras de atomicidade:
- **Exceções Silenciosas (`catch {}` vazios):** Na verificação de e-mail no login, na inserção de sessão em `user_sessions`, na geração de log de auditoria em `audit_events` e na consulta de hash em `change-password`, erros de banco de dados eram capturados e ignorados silenciosamente.
- **Inconsistência de Estado (Cookie sem Registro no Banco):** No login, se a inserção no PostgreSQL falhasse (ex.: por falha de conectividade ou indisponibilidade pontual), o controlador retornava `200 OK` e emitia o header `Set-Cookie`. O cliente recebia um cookie cujo hash não residia no banco de dados. Em modo restrito (produção/demo sem fallback in-memory), a sessão posterior falhava repetida e confusamente, gerando alertas de intrusão/anomalia e dificultando a auditoria contínua.
- **Disfarce de Falha Operacional:** Se a consulta de usuário em `login` ou de hash em `change-password` falhasse por indisponibilidade do banco de dados, o erro era disfarçado como `401 Unauthorized` ("E-mail ou senha incorretos" ou "Senha atual incorreta").
- **Logout Otimista e Não Idempotente:** O endpoint `POST /api/auth/logout` estava acoplado ao middleware de autenticação obrigatória (`authenticated`), impedindo que clientes com sessões revogadas ou expiradas limpassem o cookie local de forma idempotente, e registrando falso log em caso de erro de persistência em produção.
- **Divergência de Política de Senha:** Critérios divergentes (8 vs 12 caracteres) estavam dispersos entre scripts de criação de admin e validações de usuário em rotas administrativas e de autenticação.

---

## 5W2H

### What (O que foi feito?)
1. **Atomicidade e Fail-Closed no Login:** Remoção de todos os blocos `catch {}` vazios de transações de sessão e auditoria no login (`/api/auth/login`) e sessão demonstrativa (`/api/demo/session`). Execução da verificação de rate limit, inserção na tabela `user_sessions` e gravação do evento em `audit_events` em uma transação SQL única (`BEGIN / COMMIT / ROLLBACK`). O cookie só é fixado e `200 OK` é retornado mediante sucesso pleno da transação; qualquer erro aciona `ROLLBACK` e retorna erro operacional sem definir o cookie.
2. **Tratamento de Indisponibilidade na Leitura:** Remoção do tratamento silencioso de erros SQL durante buscas de usuário/hash em `login` e `change-password`, convertendo quedas do PostgreSQL em erros operacionais de infraestrutura (HTTP 500/503 Problem JSON).
3. **Logout Idempotente e Confiável:** Desacoplamento de `/api/auth/logout` de verificação prévia obrigatória de sessão ativa. Limpeza imediata e autoritativa do cookie `fonolife_session` (compatibilizando perfeitamente os atributos `Path=/`, `HttpOnly`, `SameSite=Lax` e `Secure` em runtime seguro) e exclusão transacional no banco com auditoria ligada apenas quando uma sessão real foi excluída (`rowCount > 0`). Em produção, falha de infraestrutura durante revogação impede a afirmação ilusória de sucesso.
4. **Centralização de Política de Cookie e Proibição de Fallback In-Memory:** Concentração das opções canônicas de cookies de sessão em helpers dedicados em `middleware.ts` e bloqueio estrito do uso do fallback em memória (`authMemoryFallback`) em ambientes de `production` ou `demo`.
5. **Política Única e Centralizada de Senhas:** Criação de constante (`MIN_PASSWORD_LENGTH = 8`) e validador central (`isPasswordPolicyValid`) em `src/domain/security.ts`, aplicados uniformemente aos fluxos de criação de admin (`create-admin.ts`, `bootstrap-admin.ts`), usuários via administração (`POST/PATCH /api/admin/users`), e alteração de senha (`change-password`).

### Why (Por que foi feito?)
Para garantir que operações de segurança de fronteira falhem de forma explícita e autossuficiente (fail-closed), eliminando estados divididos (cookies sem persistência) e protegendo a integridade inegociável da auditoria LGPD/clínica no monólito modular Fonolife.

### Where (Onde foram feitas as alterações?)
- `src/domain/security.ts`: Definição de `MIN_PASSWORD_LENGTH`, type guard `isPasswordPolicyValid` e centralização de validação de senha.
- `src/config.ts`: Vedação categórica de fallback in-memory em `production` e `demo`.
- `src/modules/auth/middleware.ts`: Helpers de cookie de sessão (`setSessionCookie`, `clearSessionCookie`, `getSessionCookieOptions`) e verificação canônica contra fallback volátil.
- `src/modules/auth/routes.ts`: Transações SQL atômicas em `login`, `demo/session` e `logout`; eliminação de blocos silenciosos e validações centralizadas.
- `src/modules/admin/routes.ts`: Aplicação da política centralizada de senhas e alocação coerente para suporte ao perfil de `doctor`.
- `src/db/create-admin.ts` e `src/scripts/bootstrap-admin.ts`: Homogeneização com a política de senhas de 8 caracteres no bootstrap administrativo.
- `tests/auth-atomicity-regression.test.ts`: Suíte rigorosa demonstrando as correções dos quatro cenários críticos (login falha sem definir cookie no erro de banco; erro operacional em queda do SELECT user; logout idempotente no 204; validação central de senha no admin com 400 problem json).
- `tests/auth-session.test.ts`: Ajuste para suporte à verificação fail-closed contra enumeração com mock determinístico do SELECT.

### When (Quando foi executado?)
Durante a iteração de endurecimento técnico e correção transacional (PR 07).

### Who (Quem executou?)
Antigravity AI (Google DeepMind - Advanced Agentic Coding).

### How (Como foi validado e testado?)
1. **Suíte Focada de Regressão:** `node --import tsx --test tests/auth-atomicity-regression.test.ts` validou a rejeição de cookie sem commit e a semântica operacional de indisponibilidade.
2. **Suites de Autenticação e Segurança:** Execução contínua de `tests/auth-session.test.ts`, confirmando comportamento blindado sem quebra contra enumeração de identidades nem no controle distribuído de rate limiting.
3. **Bateria Integral de Testes e Higiene:** Execução de `npm test` confirmando **185 testes passando simultaneamente** (0 falhas) em todo o monólito e aprovação em `npm run repo:hygiene`.
4. **Atualização do Grafo Semântico:** Invocação de `graphify update .` para sincronização atualizada de metadados e ASTs.

### How Much (Qual o custo/impacto computacional e arquitetural?)
Custo quase nulo: os hashes scrypt (operados com computação intensiva na CPU) continuam precedendo o isolamento do lock e a abertura de transação do PostgreSQL, poupando portas no connection pool e evitando starvation durante picos de autenticação.

---

## Matriz de Riscos, Retentivas e Rollback

### Riscos e Mutações Potenciais
- **Aumento na Sensibilidade a Quedas Rápidas do Banco:** Clientes experimentam resposta HTTP 500/503 imediata (com mensagens padronizadas em Problem JSON) durante falhas do PostgreSQL ao tentar fazer login, em vez do mascaramento incoerente de 401 ou de sessões fantasma sem validade.

### Plano de Rollback
1. Em caso de anomalia regressiva inesperada na gravação em produção, reverta o commit da PR:
   ```bash
   git revert -m 1 <hash_do_merge_pr07>
   ```
2. Imprima os testes e reinstaure o serviço para verificar estabilidade sem quebra de sessão ativa:
   ```bash
   npm test && npm run dev
   ```
