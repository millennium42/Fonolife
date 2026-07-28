# 5W2H — PR 03: Correção de Readiness (/api/health) e Semântica Unificada de Runtime de Produção

## 1. Resumo Executivo 5W2H

| Pergunta | Detalhamento |
| :--- | :--- |
| **What** (O que foi feito?) | Refatoração de `/api/health` para obedecer rigorosamente às regras de *readiness*, adotando fail-closed com status HTTP `503 Service Unavailable` perante falha do PostgreSQL, S3 ou ClamAV; adição do endpoint de *liveness* (`/api/health/live`); unificação da semântica de runtime de produção entre `APP_ENV` e `NODE_ENV` para controle de segurança (HSTS e cookies Secure); e fortalecimento de validação no startup. |
| **Why** (Por que foi feito?) | O endpoint anterior `/api/health` retornava HTTP 200 de forma silenciosa mesmo quando o corpo reportava `unavailable`, enganando balanceadores de carga (como no Render/Docker) e roteando tráfego para instâncias inoperantes ou comprometidas ("infected"). Além disso, divergências entre `NODE_ENV` e `APP_ENV` abriam brechas que inibiam cabeçalhos HSTS e marcação `Secure` nos cookies em produção. |
| **Who** (Quem realizou e validou?) | Implementado e testado de ponta a ponta na suíte de testes TS/ESM do repositório, obedecendo às diretrizes de arquitetura monólita sem ORM (*Ponytail full doctrine*). |
| **When** (Quando é aplicado?) | Validações de configuração ocorrem no momento da inicialização da aplicação (startup fail-closed). Checagens de readiness são disparadas continuamente pelos health checks da infraestrutura sem reter sessões (timeouts individuais máximos de 2,5s a 3s). |
| **Where** (Onde no código?) | `src/config.ts`, `src/modules/health/routes.ts`, `src/app.ts`, `render.yaml`, `tests/readiness-production-repro.test.ts` e `tests/readiness-production-regressions.test.ts`. |
| **How** (Como foi implementado?) | 1) Unificação em `src/config.ts`: `secureRuntime` agora deriva exclusivamente de `APP_ENV=production`, disparando exceção de inicialização se `NODE_ENV` contradizer essa semântica ou se `APP_ORIGIN` usar HTTP inseguro.<br>2) Indisponibilidade de componentes obrigatórios reportam HTTP `503`, protegendo o roteador contra tráfego falho.<br>3) Exceções 503 são preservadas no error handler do Fastify em vez de decaírem para erro genérico 500.<br>4) Operações nativas sem uso de chaves fictícias no S3 e sem tráfego de dados clínicos em observação operacional. |
| **How Much** (Quanto custo / impacto?) | Zero custo computacional extra ou impacto destrutivo na base. O isolamento de falhas sem ORM e com chamadas nativas garante baixíssimo consumo de memória e latência sob verificação contínua. |

---

## 2. Justificativa Explícita Contra Regressões na Produção

1. **Eliminação do falso-positivo no Balanceador de Carga (Fail-Closed no Health Check):**
   A alteração de retorno HTTP `200` para `503 Service Unavailable` em ocasiões em que o banco, o storage S3 ou o scanner ClamAV reportam falhas, queda ou infecção assegura que instâncias do Node/Fastify com dependências indisponíveis ou quarentenadas sejam removidas imediatamente da rotação ativa pelo balanceador de carga.
2. **Prevenção de Tráfego sem Criptografia em Produção:**
   A unificação de `secureRuntime` impede cenários onde a aplicação seja promovida a produção com `APP_ENV=production` mantendo um `NODE_ENV=development` esquecido em script ou arquivo `.env`, o que desabilitava cookies `Secure` e o cabeçalho `Strict-Transport-Security`. Além disso, a inicialização aborta (fail-fast no startup) caso o `APP_ORIGIN` não inicie por `https://` no ambiente de produção.
3. **Sem Degradação Silenciosa em Scanner e Storage:**
   Qualquer retorno diferente de `clean` ou `ok` do scanner antivírus é traduzido em resposta de indisponibilidade `503`, impedindo que o sistema processe arquivos clínicos desprotegidos.

---

## 3. Evidência Verificável das Suítes de Testes (TS/ESM)

A entrega incorpora dois arquivos dedicados de reprodução e regressão, integrados ao fluxo `npm test`:
- `tests/readiness-production-repro.test.ts`: Demonstra a conversão da falha do HTTP 200 no estado de indisponibilidade para 503, bem como a validação estrita no startup perante origem sem TLS (HTTP).
- `tests/readiness-production-regressions.test.ts`: Cobre 100% dos cenários de regressão estipulados no prompt:
  1. Liveness (`/api/health/live`) retornando 200 OK de modo imutável com o processo rodando, mesmo mediante degradação simulada do PostgreSQL, S3 e ClamAV;
  2. Readiness (`/api/health`) reportando status HTTP 200 exclusivamente quando o PostgreSQL, storage e scanner operam em conformidade plena e limpa;
  3. Rejeição com HTTP 503 quando o adapter do storage ou do scanner retorna false, falha de comunicação, erro de rede ou quarentena por malware ("infected");
  4. Queda imediata e segura de readiness (<1000ms, respeitando timeout sem travar) durante desconexões de rede com o PostgreSQL;
  5. Controles estritos no startup perante valores numéricos incompatíveis ou variáveis proibidas (`DEMO_*` e `AUTH_MEMORY_FALLBACK` em produção).

---

## 4. Plano de Reversão Explícito e Compatível (Rollback sem Remoção Destrutiva)

Como ditaram os invariantes da arquitetura e as regras do *Ponytail doctrine*:
- **Inexistência de alterações no PostgreSQL:** Esta entrega atua primariamente na camada de roteamento HTTP Fastify e validação de configuração, **sem efetuar ou exigir nenhuma alteração destrutiva ou aditiva no esquema (migrations) ou nas tabelas do banco de dados PostgreSQL 18**.
- **Procedimento de Reversão Isolada:** Em caso de anomalia não prevista no ambiente (ex.: regra restritiva excessiva em ambientes de teste customizados):
  1. O SHA da PR 03 pode ser revertido limpamene via `git revert <SHA>`, reinaugurando a lógica de rotas anterior de `healthRoutes` sem qualquer conflito estrutural ou bloqueio de schema;
  2. Nenhuma tabela, coluna ou histórico financeiro/audit-trail do PostgreSQL necessita ser apagada ou estornada no rollback, pois as rotas de *health check* e de liveness são integralmente imutáveis em relação aos dados reais do negócio e mantêm zero acoplamento de estado destrutivo.
