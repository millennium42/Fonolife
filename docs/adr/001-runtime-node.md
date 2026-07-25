# ADR 001 — Runtime Node.js

## Estado

Aceita no marco lógico PR 16; a prova remota depende da CI do respectivo push na `main`.

## Contexto

O Docker e a documentação usavam Node.js 24, enquanto `package.json` aceitava 20+ e a CI fixava Node.js 20. Essa divergência permitia validar e publicar runtimes diferentes.

## Decisão

Todos os ambientes usam a linha principal Node.js 24:

- `package.json` e `package-lock.json`: `>=24 <25`;
- Docker: `node:24-alpine`;
- GitHub Actions: Node 24;
- Render: `NODE_VERSION=24`;
- gerenciadores locais: `.nvmrc` e `.node-version` com `24`.

Node.js 20 não foi mantido porque não houve incompatibilidade reproduzível nos gates existentes.

## Consequências

Uma versão principal única reduz diferenças entre desenvolvimento, CI, imagem e deploy. Atualizações dentro da linha 24 continuam permitidas pelo gerenciador de pacotes e pelas imagens oficiais.

## Política de atualização

Uma troca de versão principal exige nova ADR, execução de `npm ci`, typecheck, testes, build, audit, Docker, migrations, smoke e Playwright.

## Rollback

Reverter os arquivos de runtime para o SHA anterior. Não há migration ou alteração de dados associada a esta decisão.
