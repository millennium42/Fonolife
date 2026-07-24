# 5W2H — PR 12: Fechar Fluxo de Laudo Médico, Impressão e Exportação em PDF

## Contexto

Esta entrega (PROMPT 08) implementa o módulo formal de laudos clínicos e audiométricos do Fonolife, garantindo a emissão de pareceres estruturados, validação de registro profissional (CRM/CRFa), imutabilidade append-only no banco (`medical_reports`), layout timbrado oficial para impressão ou exportação em PDF e auditoria automatizada.

---

## Estrutura 5W2H

### 1. What (O que foi feito?)
- **Migration & Tabela Imutável**: Migration `migrations/020_medical_reports.sql` criando a tabela `medical_reports` protegida por trigger que bloqueia `UPDATE`/`DELETE`.
- **Validação no Domínio**: `src/domain/reports.ts` com validação de campos estruturados (Título, Diagnóstico, Conduta) e obrigatoriedade de registro profissional CRM/CRFa.
- **Rotas API**:
  - `POST /api/patients/:id/medical-reports`: Emissão com validação de CRM/CRFa do usuário e gravação em `patient_events` e `audit_events`.
  - `GET /api/patients/:id/medical-reports`: Listagem histórica dos laudos do paciente.
  - `GET /api/medical-reports/:id`: Detalhes do laudo para pré-visualização.
  - `POST /api/medical-reports/:id/print-audit`: Auditoria de evento de impressão.
- **Interface & CSS Print**:
  - Formulário `NewMedicalReportModal` no prontuário do paciente.
  - Modal `MedicalReportViewerModal` apresentando o laudo oficial timbrado com o cabeçalho da clínica Fonolife (CNPJ 12.345.678/0001-90).
  - Regras CSS `@media print` para ocultar menus e exibir uma folha A4 limpa ao acionar a impressão do navegador (`window.print()`).

### 2. Why (Por que foi feito?)
- Fornecer respaldo fonoaudiológico e legal, permitindo que profissionais emitam laudos técnicos com assinatura e CRM/CRFa e entreguem cópias impressas ou em PDF para pacientes e acompanhantes.

### 3. Where (Onde foi aplicado?)
- `migrations/020_medical_reports.sql`
- `src/domain/reports.ts`
- `src/modules/reports/routes.ts`
- `src/app.ts`
- `web/src/main.tsx`
- `web/src/style.css`
- `tests/medical-reports.test.ts`
- `docs/5w2h-pr12-medical-report-print-pdf.md`

### 4. When (Quando foi executado?)
- No fluxo sequencial do Fonolife (PROMPT 08), após a conclusão da PR 11.

### 5. Who (Quem participou?)
- Agente de IA e equipe de engenharia.

### 6. How (Como foi implementado?)
- Branch isolada `codex/pr-12-medical-report-print-pdf` criada a partir da `main`.
- Desenvolvido em 5 commits granulares.
- Validado com os gates `rtk npm run typecheck`, `rtk npm test`, `rtk npm run build` e `rtk npm audit`.

### 7. How Much (Quanto custou/impacto?)
- Sem custos de bibliotecas externas pesadas; usa a API nativa de impressão do navegador (`window.print()`) combinada com `@media print`.

---

## Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Emissão de laudo por usuário sem CRM/CRFa | Baixa | Alto | Bloqueio de validação no backend `user.license_number` (400 Bad Request se em branco). |
| Alteração retroativa de laudo emitido | Baixa | Alto | Trigger PostgreSQL `reject_medical_report_changes` impede `UPDATE`/`DELETE`. |
| Impressão desformatada ou com elementos de UI | Baixa | Médio | Regras estritas `@media print` isolando `#printable-medical-report`. |

---

## Evidências de Validação

- `rtk npm run typecheck`: OK (0 erros de compilação).
- `rtk npm test`: OK (90 testes aprovados).
- `rtk npm run build`: OK (bundle de servidor e Vite web compilados).
- `rtk npm audit --audit-level=high`: OK (0 vulnerabilidades).
- `rtk git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`: OK.
