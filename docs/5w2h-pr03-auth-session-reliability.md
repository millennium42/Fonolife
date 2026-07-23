# Documentação 5W2H — PR 03: Autenticação Modular, Rate Limit Distribuído e Sessões

## 1. Matriz 5W2H
- **What (O que):** Refatoração e endurecimento da arquitetura de autenticação e sessões:
  1. Registro único do módulo `authRoutes` em `src/modules/auth/routes.ts` e eliminação completa das rotas duplicadas em `src/app.ts`.
  2. Implementação de rate limit distribuído no PostgreSQL através da tabela `login_rate_limits`, utilizando a chave composta `rate_limit:<IP>:<EMAIL_NORMALIZADO>` para suportar múltiplas instâncias em paralelo.
  3. Respostas uniformes contra enumeração de usuários (`401` com a mensagem `"E-mail ou senha incorretos"` tanto para e-mails inexistentes quanto para senhas inválidas).
  4. Revogação atômica de sessões:
     - Em `POST /api/auth/change-password`, a sessão corrente sobrevive e todas as demais sessões do usuário são revogadas.
     - Em `PATCH /api/admin/users/:id`, ao desativar a conta, alterar o perfil ou redefinir a senha do usuário, todas as suas sessões ativas são invalidadas imediatamente.
  5. Configuração de `trustProxy: true` no Fastify para leitura precisa de `request.ip` atrás dos proxies reversos do Render.
  6. Script CLI seguro de bootstrap do primeiro administrador (`src/scripts/bootstrap-admin.ts` / `npm run bootstrap-admin`), que lê credenciais de variáveis de ambiente sem logar a senha.
- **Why (Por que):** Impedir contorno de rate limit em ambiente de múltiplas instâncias (Render), evitar ataques de enumeração de e-mails, garantir revogação imediata de acesso ao alterar credenciais e separar o bootstrap do ambiente de demonstração.
- **Where (Onde):** `src/modules/auth/`, `src/app.ts`, `src/scripts/bootstrap-admin.ts`, `migrations/016_auth_sessions.sql`, `tests/auth-session.test.ts` e `docs/5w2h-pr03-auth-session-reliability.md`.
- **When (Quando):** Ciclo da entrega `codex/pr-03-auth-session-reliability`.
- **Who (Quem):** Equipe Antigravity.
- **How (Como):** Migração aditiva PostgreSQL, registro modular Fastify, consultas SQL atômicas de bloqueio e desativação em cascata de sessões.
- **How Much (Quanto Custa):** Custo nulo de infraestrutura; otimização do monólito modular existente.

---

## 2. Matriz de Invalidação e Revogação de Sessões

| Ação Executada | Sessão Atual | Demais Sessões Ativas do Usuário | Justificativa de Segurança |
|---|---|---|---|
| **Troca de Senha pelo Usuário** | Mantida (`keepTokenHash`) | Revogadas (`DELETE`) | Preserva o fluxo ativo do usuário logado e invalida acessos em outros dispositivos |
| **Desativação de Usuário pelo Admin** | Revogada | Revogadas (`DELETE`) | Bloqueio imediato de acesso operacional |
| **Redefinição de Senha pelo Admin** | Revogada | Revogadas (`DELETE`) | Força o usuário a realizar novo login com a senha temporária |
| **Alteração de Perfil pelo Admin** | Revogada | Revogadas (`DELETE`) | Garante emissão de novo token com o perfil/privilégio atualizado |
| **Expiração Temporal (8 horas)** | Revogada (`cleanup`) | Revogadas (`cleanup`) | Limpeza automática no banco de dados |

---

## 3. Configuração de Reverse Proxy & Render

- O servidor Fastify está configurado com `trustProxy: true`.
- Em produção no Render, o cabeçalho `X-Forwarded-For` é utilizado para extrair o IP real do cliente.
- O rate limit calcula o hash de tentativas usando o IP extraído concatenado com o e-mail normalizado (`LOWER(TRIM(email))`), impedindo um atacante de estourar a cota de outros usuários no mesmo IP ou realizar bruteforce distribuído contra uma única conta.

---

## 4. Testes & Cobertura
- `npm run typecheck`: 0 erros.
- `npm test`: 56 testes passados (100% de aprovação).
- `npm run build`: Build de produção executado com sucesso.
- `npm audit --audit-level=high`: 0 vulnerabilidades.

---

## 5. Plano de Rollback
- Reverter commit/merge da branch `codex/pr-03-auth-session-reliability`.
- Caso a migração `016_auth_sessions.sql` tenha sido aplicada em produção, a tabela `login_rate_limits` e os índices adicionados em `user_sessions` são aditivos e não causam quebra em consultas das versões anteriores.
