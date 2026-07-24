# Documentação 5W2H — Autenticação, Proteção CSRF, Rate Limit e Sessões (PR-05)

## 1. Visão Geral (5W2H)

### What (O que)
Implementação de validação estrita de CSRF (`Origin`/`Referer`), eliminação de fallbacks silenciosos em memória para rate limit em ambiente de produção, anonimização de chaves com SHA-256 e revogação comprovável de sessões no PostgreSQL.

### Why (Por que)
Evitar bypasses de CSRF via domínios com sufixos atacantes (ex: `dominio.com.atacante.com`), impedir bypasses de rate limit quando o banco de dados falha em produção e garantir que o encerramento ou invalidação de sessões seja atômica e comprovada no banco de dados.

### Who (Quem)
Desenvolvido pelo time de Engenharia de Segurança para proteger todos os operadores, administradores e médicos da plataforma Fonolife.

### Where (Onde)
Nos arquivos `src/app.ts`, `src/config.ts`, `src/modules/auth/middleware.ts` e `src/modules/auth/routes.ts`.

### When (Quando)
Janeiro de 2026 — Integração para a release de hardening de segurança (PR-05).

### How (Como)
1. **CSRF**: Comparação estrita de `new URL(referer).origin === new URL(allowedOrigin).origin` ao invés de `startsWith`. Rejeição de URLs malformadas.
2. **Rate Limit**: Armazenamento de chaves no formato `rate_limit:<sha256(ip:email).slice(0,32)>`. Lançamento explícito de exceção quando o banco falha e `AUTH_MEMORY_FALLBACK` não está habilitado.
3. **Revogação de Sessões**: Remoção de retornos simulados em memória quando o PostgreSQL falha. A troca de senha preserva o token atual e invalida os demais; desativações e redefinições administrativas invalidam todas as sessões.

### How Much (Quanto)
Sem custos computacionais adicionais significativos. A anonimização por hash reduz a pegada de armazenamento e evita logs de PII/e-mails.

---

## 2. Riscos e Impacto

- **Riscos de Compatibilidade**: Clientes não navegadores enviando requisições sem `Origin` ou `Referer` em endpoints de mutação serão bloqueados com `403 Forbidden`. Requisições via API devem enviar o cabeçalho `Origin` correspondente à origem configurada.
- **Falha de Infraestrutura**: Em caso de indisponibilidade do PostgreSQL, requisições de login e revogação em produção falharão com erro explícito (500/problem+json) ao invés de permitir acessos sem controle de taxa.

---

## 3. Plano de Rollback

1. Reverter os commits da branch `codex/pr-05-auth-csrf-hardening`.
2. Restaurar `src/app.ts` e `src/modules/auth/middleware.ts` para os commits base auditados.
3. Reiniciar a aplicação.
