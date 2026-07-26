# 5W2H — PR 18: convergência da interface clínica

## Matriz

- **What:** consolidar tokens, componentes, shell, tabelas, modais, navegação de pacientes, responsividade, acessibilidade e baseline visual.
- **Why:** remover estilos e comportamentos divergentes e tornar os fluxos operacionais previsíveis por teclado, mouse e leitor de tela.
- **Where:** `web/src`, testes E2E e documentação do design system.
- **When:** marco lógico PR 18, aplicado diretamente sobre `main` conforme a governança vigente.
- **Who:** manutenção do Fonolife, com validação automatizada no CI.
- **How:** componentes compartilhados, um único conjunto de tokens, `PatientLink` global, testes axe/Playwright e screenshots determinísticos.
- **How much:** sem serviço, framework ou dependência de produção adicional.

## Riscos e mitigação

- regressão visual: nove baselines versionados e inspecionados;
- perda de foco em diálogos: teste de trap, `Escape` e retorno ao gatilho;
- conteúdo largo: tabelas e navegação com rolagem horizontal rotulada;
- modal aninhado: prontuário global implementado como `Drawer` não modal;
- movimento desconfortável: regra `prefers-reduced-motion`.

## Rollback

Reverter os commits deste marco restaura o shell e os estilos anteriores. Não há migration, alteração de contrato HTTP ou transformação de dados.

## Aceite

- P0: 0;
- P1: 0;
- axe crítico/sério: 0;
- Playwright: deve permanecer verde local e remotamente;
- baseline visual: nove imagens analisadas e aprovadas.
