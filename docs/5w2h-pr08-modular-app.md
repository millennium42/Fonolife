# 5W2H — PR 08: Refatorar e Modularizar a API (`src/app.ts`)

## Contexto

Esta entrega (PROMPT 04) desmembra o arquivo monolítico `src/app.ts` (originalmente com 2.172 linhas) em uma estrutura modular por domínios em `src/modules/`, mantendo 100% dos contratos HTTP, comportamentos de segurança (RBAC, BOLA/IDOR, CSRF, rate limit) e tratamento de erros inalterados.

---

## Estrutura 5W2H

### 1. What (O que foi feito?)
- Redução de `src/app.ts` de 2.172 linhas para 157 linhas, mantendo apenas a orquestração de infraestrutura, hooks globais de segurança e o registro dos módulos via `app.register(...)`.
- Criação dos módulos de domínio com responsabilidades isoladas:
  - `src/modules/audit/`: serviço centralizado de auditoria (`audit` e `auditDenial`).
  - `src/modules/patients/`: autorização por paciente e rotas da ficha clínica, timeline, eventos e acompanhamentos.
  - `src/modules/attachments/`: upload streaming, quarentena, scanner e download de exames/laudos.
  - `src/modules/catalog/`: gestão de produtos, serviços com CMV e movimentações de estoque.
  - `src/modules/finance/`: lançamentos do ledger, recebíveis, vendas por catálogo e agregados do caixa/dashboard.
  - `src/modules/doctors/`: agenda médica, listagem de pacientes vinculados e consultas/atendimento.
  - `src/modules/privacy/`: exportação JSON e anonimização LGPD.
  - `src/modules/admin/`: gestão administrativa de usuários.
  - `src/modules/health/`: endpoints de saúde do sistema (`/api/health`) e configuração.
- Criação da suíte `tests/http-contracts.test.ts` para garantia de regressão zero nas rotas da API.

### 2. Why (Por que foi feito?)
- Eliminar o acoplamento do monólito `src/app.ts`, permitindo que cada área do sistema evolua de forma independente, coesa e legível sem riscos de regressões cruzadas.

### 3. Where (Onde foi aplicado?)
- `src/app.ts`
- `src/modules/` (`audit`, `patients`, `attachments`, `catalog`, `finance`, `doctors`, `privacy`, `admin`, `health`)
- `tests/http-contracts.test.ts`
- `docs/5w2h-pr08-modular-app.md`
- `docs/arquitetura-do-sistema.md`

### 4. When (Quando foi executado?)
- No fluxo sequencial do Fonolife (PROMPT 04), após a consolidação dos gates de CI na PR 07.

### 5. Who (Quem participou?)
- Agente de IA e equipe de engenharia.

### 6. How (Como foi implementado?)
- Criação da branch isolada `codex/pr-08-modular-app` a partir da `main`.
- Execução em 8 commits granulares.
- Congelamento preventivo de contratos HTTP em teste automatizado.
- Validação contínua com `rtk npm run typecheck`, `rtk npm test`, `rtk npm run build` e `rtk npm audit --audit-level=high`.

### 7. How Much (Quanto custou/impacto?)
- Zero alteração no banco de dados ou contratos de cliente (Vite web).
- Redução de ~93% no tamanho de `src/app.ts`.

---

## Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Quebra involuntária de endpoint ou status code durante a divisão | Baixa | Alto | Teste congelador de contratos HTTP `tests/http-contracts.test.ts` e suíte completa de 82 testes. |
| Dependência circular entre módulos | Baixa | Médio | Centralização de ajudantes de autorização e auditoria em camadas base. |

---

## Evidências de Validação

- `rtk npm run typecheck`: OK (0 erros de compilação).
- `rtk npm test`: OK (82 testes aprovados, incluindo contratos HTTP).
- `rtk npm run build`: OK (bundle compilado com sucesso).
- `rtk npm audit --audit-level=high`: OK (0 vulnerabilidades).
- `rtk git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`: OK.

---

## Plano de Rollback

Em caso de divergência contratual pós-merge:
1. Reverter o merge da PR na `main`: `rtk git revert -m 1 <sha-do-merge>`.
2. Validar a execução da suíte de testes na `main`.
