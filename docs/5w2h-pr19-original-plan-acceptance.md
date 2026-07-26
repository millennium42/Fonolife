# 5W2H — PR 19: aceite do plano funcional original

- **What:** matriz de 71 requisitos e cinco jornadas E2E de operador, Caixa, médico, administrador e LGPD.
- **Why:** substituir alegações históricas por rastreabilidade executável sobre a `main`.
- **Where:** matriz, jornadas E2E, módulos de pacientes/financeiro, frontend e migration `021_sale_cost_snapshot.sql`.
- **When:** marco lógico PR 19, após a convergência visual.
- **Who:** manutenção do Fonolife e CI.
- **How:** cada requisito liga backend, frontend, teste e evidência; jornadas transversais exercitam os fluxos no ambiente demo isolado.
- **How much:** sem dependência nova; uma migration aditiva e retrocompatível registra a fonte de catálogo e o CMV da venda.

## Achados corrigidos

- o Caixa dependia apenas da atualização assíncrona de estado para bloquear duplo clique; uma guarda síncrona em memória agora impede reentrada;
- os itens de navegação do médico não selecionavam a agenda nem a lista autorizada; agora usam `/api/doctor/schedule` e o prontuário já filtrado por vínculo.
- lançamentos não guardavam o custo histórico, e o relatório não tinha paginação/exportação/CMV/margem; a venda agora captura o snapshot e o financeiro expõe esses controles;
- endpoints financeiros genéricos aceitavam qualquer perfil autenticado; agora exigem administrador ou operador, enquanto a visão comercial do prontuário continua protegida por autorização do paciente;
- vendas de serviços podiam baixar insumos concorrentes sem serializar os produtos; locks ordenados impedem saldo negativo.

## Riscos e rollback

O teste de Caixa cria uma venda demo e depende do isolamento e descarte do volume ao final do gate. O rollback da aplicação é a reversão dos commits; as colunas aditivas da migration podem permanecer sem afetar a versão anterior. Não remover snapshots já gravados durante rollback operacional.
