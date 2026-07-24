#!/usr/bin/env bash
set -e

echo "=== [FONOLIFE] Executando Validação da Esteira de CI/CD Local ==="

echo "1/6 Checando formatação e whitespace..."
git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check

echo "2/6 Executando Typecheck..."
npm run typecheck

echo "3/6 Executando Suíte de Testes..."
npm test

echo "4/6 Compilando Build de Produção..."
npm run build

echo "5/6 Executando Auditoria de Segurança..."
npm audit --audit-level=high

echo "6/6 Verificando extração AST do Graphify..."
npx graphify update .

echo "✅ [FONOLIFE] Todos os 6 gates de qualidade foram aprovados com sucesso!"
