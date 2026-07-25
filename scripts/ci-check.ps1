param([switch]$Full)

$ErrorActionPreference = "Stop"
$mode = if ($Full) { "--full" } else { "--quick" }
$bashCandidates = @(
  "$env:ProgramFiles\Git\bin\bash.exe",
  "$env:ProgramFiles\Git\usr\bin\bash.exe",
  (Get-Command bash -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1)
) | Where-Object { $_ -and (Test-Path $_) }

if (-not $bashCandidates) {
  throw "Bash não encontrado. Instale Git for Windows ou execute o script no Linux."
}

& $bashCandidates[0] scripts/ci-check.sh $mode
exit $LASTEXITCODE
