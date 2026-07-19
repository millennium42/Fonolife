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

## PR 2

- Typecheck, 6 testes e build aprovados.
- Domínio valida nome, telefone, status, origem e tipos de evento.
- Migration cria pacientes arquiváveis e eventos imutáveis.
- API cobre busca/filtro, cadastro, ficha, edição com conflito 409, arquivamento, interação e timeline.
- Interface cobre cadastro básico, campos adicionais progressivos, lista e ficha responsiva.

## PR 3

- Typecheck, testes de datas em São Paulo e build aprovados.
- Tarefas preservam histórico e não aceitam exclusão.
- Próximo contato é derivado da tarefa aberta mais próxima.
- Filas cobrem hoje, atrasados, próximos, adaptação e 90 dias sem contato.
