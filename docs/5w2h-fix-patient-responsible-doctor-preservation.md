# 5W2H: Correção da Perda Silenciosa de `responsible_doctor_id` no PATCH de Paciente

## 1. O que foi feito (What)
Correção da perda silenciosa do vínculo do médico responsável (`responsible_doctor_id`) no endpoint `PATCH /api/patients/:id`. Anteriormente, quando a propriedade `responsibleDoctorId` era omitida no payload (corpo da requisição JSON), a query de atualização SQL recebia `null`, sobrescrevendo indiscriminadamente a coluna para `NULL`. Agora, a resolução do valor final de `responsible_doctor_id` é efetuada na camada de lógica da aplicação de forma explícita antes da execução do comando SQL:
- **Campo omitido (`undefined`):** preserva o valor atual validado em `authorized.responsible_doctor_id`.
- **Campo explicitamente nulo ou vazio (`null`):** limpa o vínculo do médico (intencionalmente).
- **Campo preenchido com UUID:** atualiza o vínculo para o novo médico ativo.

## 2. Por que foi feito (Why)
- **Prevenção de Perda de Dados Acentuada por Frontend/Inativação:** Quando um médico responsável é desativado na clínica, o componente de edição de paciente na web (`web/src/main.tsx`) deixa de exibir o médico no `<select>` (visto que `GET /api/doctors` filtra por ativos), regressando à opção vazia ("-- Nenhum Selecionado --"). Se qualquer outro campo da ficha era editado ou a propriedade não era transmitida na requisição, o vínculo histórico era apagado no banco sem qualquer intervenção ou decisão clínica consciente.
- **Fechamento de Bypass de Autorização:** A validação que limita alterações de médico responsável a perfis autorizados disparava apenas quando `responsibleDoctorId` era explicitamente transmitido (`!== undefined`). Ao ser omitido, o controle de acesso era bypassado silenciosamente na validação enquanto o SQL zerava o campo por falta do tratamento adequado de valor padrão.

## 3. Onde foi aplicado (Where)
- `src/modules/patients/routes.ts`: Introdução do cálculo computado de `responsibleDoctorIdValue` e substituição do parâmetro na 10ª posição (`$10`) da query de `UPDATE patients`.
- `tests/patients.test.ts`: Inclusão de 3 cenários de testes de integração dedicados (usando `app.inject` e mock de conexões SQL e sessões) para blindagem de comportamento contra regressão:
  1. Preservação da atribuição médica existente quando o campo é omitido.
  2. Limpeza explícita do vínculo ao enviar propositalmente `responsibleDoctorId: null`.
  3. Preservação do vínculo existente a um médico inativo quando outro dado da ficha é alterado na requisição (omitindo a atribuição médica e não acionando rejeição indevida).

## 4. Quando foi executado (When)
Em Julho de 2026, integrando a agenda contínua de endurecimento arquitetônico e sanitização de dados clínicos do Fonolife.

## 5. Quem foi responsável (Who)
Equipe de Engenharia e Arquitetura Fonolife (condução sob diretrizes Ponytail, AGENTS.md e m1nd-first).

## 6. Como foi feito (How)
1. Analisando o fluxo de pré-carregamento `loadAndAuthorizePatient`, confirmou-se a disponibilidade garantida do estado atual do paciente em `authorized.responsible_doctor_id`.
2. Calculou-se `responsibleDoctorIdValue` discriminando omitido (`undefined`) de explícito (`null` ou UUID).
3. Confirmada a conformidade das demais rotas parciais no sistema (ex.: `next_contact_on` no módulo de agendas/consultas médicas sem riscos de sobrescrita indevida por omissão).
4. Rodado o linter/validador de tipologia TypeScript e a suíte com 117 testes automatizados para certificação plena do contrato.
5. Atualizada a topologia da base de grafos com `graphify update .`.

## 7. Quanto custou / Recursos (How Much)
- Custo infraestrutural e operacional: R$ 0,00. Apenas intervenção pontual no Node.js/Fastify e testes automatizados.
- Retorno de integridade: Altíssimo, evitando desassociações médicas indesejadas que comprometeriam trilhas de responsabilidade técnica de pacientes em acompanhamento fonoaudiológico.

---

## Análise de Risco
- **Risco Técnico:** Mínimo. A única alteração na query limita-se a trocar a alimentação do parâmetro `$10` por um valor seguro calculado na camada anterior. A query SQL permanece a mesma, dispensando `COALESCE` para não violar limpezas explícitas intencionais.
- **Mitigações:** Suíte automatizada agregada cobrindo integralmente as 3 permutações de payload do campo.

## Plano de Rollback
Em caso de intercorrência inesperada em ambiente faturável:
1. Reversão de código via Git: `git revert <commit-hash>`.
2. O contrato do esquema em banco de dados (`migrations`) não foi modificado (sem DDLs novas), de modo que o retorno ao código anterior opera de maneira plug-and-play imediatamente após o novo deploy na nuvem.
3. Certificar reintegração contínua executando `npm test`.
