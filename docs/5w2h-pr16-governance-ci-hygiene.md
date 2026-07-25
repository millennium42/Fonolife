# 5W2H — PR 16: governança, CI, runtime e higiene

## What

Alinhar Node.js 24, eliminar estado local versionado, consolidar os gates rápido/completo e registrar o fluxo de commits diretos na `main`.

## Why

CI, Docker e pacote divergiam; arquivos Graphify e hooks expunham caminhos locais; e o gate denominado completo não exercitava infraestrutura nem E2E.

## Where

`package*.json`, arquivos de runtime, workflow, scripts, `.gitignore`, testes e documentação de governança.

## When

Primeira entrega do plano de convergência, nascida da `main` remota `0e6a80d`.

## Who

Manutenção técnica pelo agente; o proprietário definiu os PRs 16–20 como marcos lógicos entregues por commits diretos na `main`.

## How

Uma única linha Node 24, uma fonte de verdade para gates locais/remotos, varredura apenas de arquivos rastreados e geração do Graphify a partir da fonte atual sem versionar caches ou estado de máquina.

## How much

Sem migration ou módulo de produto. O modo completo usa PostgreSQL e Docker temporários e remove o volume ao terminar.

## Riscos

- A CI remota ainda precisa confirmar o recibo local em Node 24.
- O modo completo exige Docker e Chromium do Playwright instalados.
- O próximo marco depende do check remoto `validate` verde para o push anterior.

## Testes

`npm run ci:check:full` aprovado localmente em Node 24: higiene de 157 arquivos, typecheck, 95/95 testes, build, audit com zero vulnerabilidades, Graphify, migrations e seed idempotentes, três smokes e 6/6 cenários Playwright/axe.

O check remoto `validate` do marco foi aprovado. A proteção que exigia PR foi removida depois da decisão explícita do proprietário por commits diretos na `main`.

## Rollback

Reverter os commits do marco. Não há alteração de schema ou dados. Os arquivos Graphify locais continuam regeneráveis por `graphify update .`.
