# Script de Validação da Esteira de CI/CD Local para Windows PowerShell
$ErrorActionPreference = "Stop"

Write-Host "=== [FONOLIFE] Executando Validação da Esteira de CI/CD Local ===" -ForegroundColor Cyan

Write-Host "1/6 Checando formatação e whitespace..." -ForegroundColor Cyan
git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "2/6 Executando Typecheck..." -ForegroundColor Cyan
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "3/6 Executando Suíte de Testes..." -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "4/6 Compilando Build de Produção..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "5/6 Executando Auditoria de Segurança..." -ForegroundColor Cyan
npm audit --audit-level=high
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "6/6 Verificando extração AST do Graphify..." -ForegroundColor Cyan
npx graphify update .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "✅ [FONOLIFE] Todos os 6 gates de qualidade foram aprovados com sucesso!" -ForegroundColor Green
