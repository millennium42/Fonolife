# Baseline do MVP para Demonstração (Fonolife)

## Diagnóstico Executivo (Estado Atual vs. Expectativa)

A aplicação apresenta uma base sólida de engenharia (TypeScript, Fastify, Docker, pipeline de CI rigoroso, RBAC), mas o front-end e a massa de dados atual não sustentam uma demonstração comercial convincente, especialmente na área clínica. 

**Lacunas identificadas:**
1. **Agenda Médica:** A expectativa é um calendário mensal (MonthCalendar) interativo. A entrega atual é um componente `DataTable` simples em formato de lista (`DoctorAgenda` no `main.tsx`).
2. **Área Clínica / Pacientes:** A interface apresenta três opções de menu para o médico ("Atendimentos", "Meus Pacientes", "Pacientes"), mas todas renderizam exatamente o mesmo componente (`PatientsWorkspace`). Faltam fluxos distintos para o prontuário.
3. **Massa de Dados (Seed Demo):** A seed atual (`src/db/seeds/demo.ts`) é escassa. O banco é povoado com apenas 3 pacientes, 2 agendamentos (um passado, um futuro) e 1 venda. A agenda pode parecer "vazia" ao ser demonstrada, tirando o peso visual de um sistema em plena operação.
4. **CRM e Timeline:** O CRM é funcional, mas carece de uma visualização mais rica de histórico de interações (timeline) que encante visualmente durante a demonstração.
5. **Barreiras Locais:** O script `scripts/ci-check.sh` trava a execução por exigir especificamente o Node v24, barrando ambientes locais mais recentes e interrompendo o pipeline de validação local rápido.

---

## Plano de Ação Priorizado (P0/P1/P2)

As correções a seguir visam estritamente o viés visual e funcional para gravação e demonstração (ignorando requisitos não-funcionais de auditoria, segurança e escala que já foram garantidos pelo núcleo do projeto).

| Prioridade | Ação | Descrição |
| :---: | :--- | :--- |
| **P0** | **Calendário Mensal (Agenda)** | Substituir a tabela atual por um grid visual de calendário (MonthCalendar) na visão do médico, permitindo visualizar os dias do mês e horários ocupados. |
| **P0** | **Desacoplamento de Visões Clínicas** | Separar as telas "Atendimentos", "Meus Pacientes" e "Pacientes" em fluxos reais, ou unificar os menus para não parecer um mock quebrado. |
| **P0** | **Enriquecimento da Seed Demo** | Expandir `src/db/seeds/demo.ts` para gerar ~20 pacientes, múltiplos agendamentos ao longo da semana/mês atual, histórico de prontuários e pelo menos 5-10 transações no caixa. |
| **P1** | **Ajuste de Ambiente Local** | Flexibilizar a checagem do `scripts/ci-check.sh` para tolerar versões mais recentes do Node (ex: >= 24) ou documentar o uso estrito no README. |
| **P1** | **Timeline Visual no CRM** | Melhorar a interface dos registros do CRM inserindo um componente simples de Timeline ao invés de listas ou tabelas cruas, mostrando o histórico de contato. |
| **P2** | **Micro-animações (Aesthetics)** | Adicionar transições sutis em modais, hovers na agenda e feedback imediato no caixa (PDV) para aumentar a percepção de "produto premium". |

---

## Mapa de Arquivos a Serem Alterados

Cada etapa de implementação afetará os seguintes arquivos do repositório. Nenhuma nova dependência será introduzida ao projeto; será aproveitado o sistema de design (CSS/Componentes) já estabelecido.

- **Agenda e Visões Clínicas (P0):**
  - `web/src/main.tsx` *(Alteração nas rotas de renderização dos menus do médico e do componente principal de agenda)*
  - `web/index.css` *(Novas classes utilitárias para o grid do calendário mensal, se necessário)*
- **Seed Demonstrativa (P0):**
  - `src/db/seeds/demo.ts` *(Adição de novos arrays e loops para gerar fixtures clínicas, financeiras e do CRM, baseadas nas datas atuais)*
- **Pipeline e Ajustes CI (P1):**
  - `scripts/ci-check.sh` *(Atualização da verificação de versão para tolerância `^24` ou superior)*
- **CRM / Timeline (P1/P2):**
  - `web/src/main.tsx` *(Alteração no render do `CrmWorkspace` para incluir classes da timeline)*
  - `web/index.css` *(Estilização da linha do tempo)*
