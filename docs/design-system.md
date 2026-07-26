# Design system clínico

O frontend usa uma única linguagem visual azul-clínica, definida em `web/src/style.css`, e componentes compartilhados em `web/src/components/ui.tsx`.

## Tokens

Os tokens `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--border-*`, `--focus-*` e `--z-*` são a fonte de verdade para cor, tipografia, espaçamento, raio, sombra, borda, foco e camadas. Os breakpoints operacionais são 800 px e 600 px. Valores locais são aceitos apenas quando representam dimensão específica do conteúdo, como largura máxima de um diálogo.

## Componentes

O catálogo compartilhado contém:

- estrutura: `AppShell`, `Sidebar`, `TopBar`, `PageHeader` e `QuickActions`;
- ações: `Button` e `IconButton`;
- superfícies: `Modal`, `ConfirmModal`, `FormModal`, `Drawer`, `Card` e `StatCard`;
- dados: `DataTable`, `Badge`, `FilterBar` e `Tabs`;
- retorno ao usuário: `Toast`, `EmptyState`, `ErrorState`, `LoadingState` e `Skeleton`;
- navegação clínica: `PatientLink`.

`Modal` prende o foco, fecha com `Escape` e devolve o foco ao elemento que o abriu. `Drawer` é uma superfície não modal usada para o prontuário global; isso permite abrir uma única ação modal a partir do prontuário sem aninhar diálogos.

Tabelas compartilhadas ficam em uma região rotulada com rolagem horizontal. Em telas estreitas, a navegação principal também permite rolagem horizontal e o conteúdo reserva espaço para não ficar oculto atrás dela. Animações são removidas quando o sistema solicita redução de movimento.

## PatientLink

Todo nome de paciente que funciona como navegação usa `PatientLink`, inclusive dashboard, listas, Caixa, vendas, recebíveis, financeiro, acompanhamento, agenda, anexos, laudos, buscas e modais.

Exceções não interativas:

- o título do prontuário já aberto identifica o registro atual;
- o nome impresso no corpo de um laudo pertence ao documento imutável;
- nomes inseridos em mensagens de WhatsApp são conteúdo textual, não navegação.

## Evidência visual e acessível

Os baselines versionados cobrem login, dashboard e modal financeiro em 360 × 800, 768 × 1024 e 1440 × 900. A data é congelada, animações são desativadas e a mesma fonte local é usada em todas as execuções. Os nove artefatos foram inspecionados após a geração.

Os testes E2E validam axe, teclado, foco preso no diálogo, `Escape`, restauração do foco e os três viewports. O baseline do modal captura o viewport para representar corretamente a superfície fixa e sua rolagem interna.
