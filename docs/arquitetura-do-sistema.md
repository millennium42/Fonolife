# Arquitetura do Sistema — Fonolife

O **Fonolife** é um monólito modular construído em Node.js (TypeScript) com Fastify, PostgreSQL e React (Vite).

---

## 1. Organização dos Módulos Backend (`src/modules/`)

A API segue uma arquitetura modular por domínios, em que a função `buildApp` em `src/app.ts` configura o servidor Fastify, os middlewares de segurança (Origin/Referer estrito, cookies seguros, auditoria e sessão) e registra os plugins de rotas:

```text
src/
├── app.ts                        # Orquestrador Fastify e registro de módulos
├── config.ts                     # Variáveis de ambiente e configurações validadas
├── db/                           # Pool de conexões PostgreSQL, migrador e seeders
├── domain/                       # Regras de domínio puras (segurança, finanças, estoque, LGPD, etc.)
└── modules/                      # Módulos de rotas e serviços por domínio
    ├── admin/                    # Gestão de usuários administradores e permissões
    ├── attachments/              # Upload streaming, scanner de vírus, quarentena e downloads
    ├── audit/                    # Serviço centralizado de log de auditoria imutável (audit_events)
    ├── auth/                     # Autenticação, gestão de sessões, troca de senha e rate limit
    ├── catalog/                  # Cadastro de produtos, serviços com CMV e controle de estoque
    ├── doctors/                  # Perfil do médico, agenda de atendimentos e registros clínicos
    ├── finance/                  # Ledger append-only, vendas por catálogo, recebíveis e caixa
    ├── health/                   # Endpoints de saúde (/api/health) e estado do sistema
    ├── import/                   # Importação CSV idempotente e resiliente (pacientes e lançamentos)
    ├── patients/                 # Ficha do paciente, acompanhamentos (follow-ups) e prontuário
    └── privacy/                  # Portabilidade de dados JSON e anonimização LGPD
```

---

## 2. Padrão de Invariantes e Segurança

1. **Domínio e Banco como Fonte de Verdade**: As regras de permissão (RBAC, autorização por objeto BOLA/IDOR), unicidade e imutabilidade são garantidas no banco de dados (PostgreSQL constraints e triggers) e na camada de domínio, nunca apenas na interface Web.
2. **Financeiro Append-Only**: Lançamentos financeiros usam centavos inteiros (`amount_cents`) e não sofrem edições destrutivas. Estornos geram compensações adicionais.
3. **Estoque e Transações**: Baixas e vendas são executadas em transações atômicas com verificação de saldo.
4. **Privacidade LGPD**: Redação dinâmica de logs e timeline para pacientes anonimizados sem apagar eventos imutáveis da auditoria.
