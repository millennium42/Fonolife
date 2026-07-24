# 5W2H — PR 11: Fortalecer Anexo Clínico, Laudo e Pré-visualização

## Contexto

Esta entrega (PROMPT 07) expande o módulo de anexos clínicos do Fonolife, adicionando categorização de exames (`audiometry`, `exam_report`, `medical_request`, `other`), observações clínicas customizadas, streaming seguro com rota de pré-visualização inline (`/api/attachments/:id/preview`), scanner anti-malware em quarentena, reconciliação de arquivos órfãos (`reconcileOrphans`) e modal de pré-visualização segura no prontuário.

---

## Estrutura 5W2H

### 1. What (O que foi feito?)
- **Migration & Banco**: Migration `migrations/019_clinical_attachment_categories.sql` com adição das colunas `category` (com validação `CHECK`) e `clinical_notes`.
- **Domínio & Upload**: Suporte às categorias de anexos no domínio (`src/domain/attachments.ts`) e recebimento no upload streaming multipart/base64.
- **Visualizador Inline**: Endpoint `GET /api/attachments/:id/preview` com headers HTTP seguros (`Content-Disposition: inline`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`) e autorização RBAC/BOLA por paciente.
- **Prontuário & Frontend**:
  - Formulário de envio no prontuário com seletor de categoria (`Audiometria`, `Laudo de Exame`, `Solicitação Médica`, `Outros`) e campo de observação.
  - Modal `AttachmentPreviewModal` para visualização em alta resolução de PDFs (iframe) e imagens sem necessidade de download físico prévio.
  - Indicadores de quarentena e scanner de vírus.

### 2. Why (Por que foi feito?)
- Permitir que fonoaudiólogos e médicos visualizem audiogramas e laudos diretamente no prontuário eletrônico do paciente com rapidez, segurança contra malwares e conformidade LGPD.

### 3. Where (Onde foi aplicado?)
- `migrations/019_clinical_attachment_categories.sql`
- `src/domain/attachments.ts`
- `src/modules/attachments/routes.ts`
- `web/src/main.tsx`
- `tests/attachment-environment-boundary.test.ts`
- `docs/5w2h-pr11-clinical-attachments-viewer.md`
- `docs/anexos-clinicos.md`

### 4. When (Quando foi executado?)
- No fluxo sequencial do Fonolife (PROMPT 07), após a conclusão da PR 10.

### 5. Who (Quem participou?)
- Agente de IA e equipe de engenharia.

### 6. How (Como foi implementado?)
- Branch dedicada `codex/pr-11-clinical-attachments-viewer` derivada da `main`.
- Executado em 5 commits granulares.
- Validação contínua com `rtk npm run typecheck`, `rtk npm test`, `rtk npm run build` e `rtk npm audit`.

### 7. How Much (Quanto custou/impacto?)
- Zero downtime e zero breaking change para anexos já existentes.
- Garantia de isolamento e checagem de vírus antes da liberação do preview.

---

## Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Injeção de scripts/malware em pré-visualização de arquivos | Baixa | Alto | Headers estritos `Content-Security-Policy`, `X-Content-Type-Options: nosniff` e bloqueio de arquivos em quarentena (`status != 'ready'`). |
| Acesso não autorizado a exames de outro médico | Baixa | Alto | Verificação centralizada `loadAndAuthorizePatient` (BOLA/IDOR) em todas as rotas de download e preview. |
| Arquivos órfãos acumulados no storage | Baixa | Médio | Serviço de reconciliação de órfãos (`reconcileOrphanAttachments`) executado via rotina admin. |

---

## Evidências de Validação

- `rtk npm run typecheck`: OK (0 erros).
- `rtk npm test`: OK (88 testes aprovados).
- `rtk npm run build`: OK (build completo).
- `rtk npm audit --audit-level=high`: OK (0 vulnerabilidades).
- `rtk git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`: OK.
