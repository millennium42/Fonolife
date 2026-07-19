# Relatório de validação

## PR 1

Escopo: compilação TypeScript, testes de senha/token/CNPJ, migrador, autenticação, autorização e Docker.

- `npm run typecheck`: aprovado.
- `npm test`: 5/5 aprovados.
- `npm run build`: aprovado.
- `docker compose up --build --wait`: `app` e PostgreSQL 18 saudáveis.
- `/api/health`: HTTP 200.
- Seed automático com `DEMO_MODE=true`: Admin e Operador autenticaram após subida limpa.
- RBAC: Operador recebeu HTTP 403 em `/api/admin/users`.
- Revisão independente: quatro P1 iniciais corrigidos; a proteção concorrente do último administrador passou a usar advisory lock transacional.

Limitação consciente: os testes de PostgreSQL real ainda são smoke do Compose; a suíte de integração será ampliada nas entregas que introduzem CRM e ledger. CRM, vendas e financeiro não pertencem a esta PR.
