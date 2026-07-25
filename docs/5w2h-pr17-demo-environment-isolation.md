# 5W2H — Marco PR 17: isolamento da demonstração

## What

Separar ambientes, seeds, banco, autenticação e reset da demonstração; remover credenciais conhecidas do frontend e do backend.

## Why

O fluxo anterior fazia auto-seed por flag genérica, publicava senhas no bundle e mantinha bypasses de senha no servidor.

## Where

Configuração, autenticação, seeders, Compose, Render, frontend, smokes, E2E e documentação operacional.

## When

Segundo marco de convergência, após o marco 16 verde na `main`.

## Who

O backend controla sessão e reset demo; operadores de infraestrutura mantêm bancos, storage e secrets separados.

## How

`APP_ENV` validado e fail-closed, `/api/demo/session` registrado somente em demo, identidades sintéticas sem senha conhecida, seeders separados e reset com confirmação, token e validação do banco `_demo`.

## How much

Sem nova migration e sem alterar dados de produção.

## Riscos, testes e rollback

Riscos principais: apontar reset ao banco errado e reintroduzir segredo no cliente. Os bloqueios são validação de host/nome do banco, token operacional, testes de configuração/rota/bundle, seed repetido, smokes e E2E.

Recibo local em Node 24: 98/98 testes, audit com zero vulnerabilidades, migrations e seed executados duas vezes, reset demo executado duas vezes, smokes de dashboard/financeiro/DevSec, imutabilidade do ledger e 6/6 cenários Playwright/axe em 360, 768 e 1440 px.

Rollback: reverter os commits do marco e nunca reutilizar o banco demo em produção.
