import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Suíte de Validação da Esteira de CI/CD e Integridade (PR-13)", () => {
  test("verifica existência do arquivo de workflow do GitHub Actions em .github/workflows/ci.yml", () => {
    const ciPath = join(process.cwd(), ".github", "workflows", "ci.yml");
    assert.equal(existsSync(ciPath), true, "O arquivo .github/workflows/ci.yml deve existir");

    const content = readFileSync(ciPath, "utf-8");
    assert.ok(content.includes("typecheck"), "Deve conter a etapa de typecheck");
    assert.ok(content.includes("npm test"), "Deve conter a etapa de execução de testes");
    assert.ok(content.includes("npm run build"), "Deve conter a etapa de build");
    assert.ok(content.includes("npm audit"), "Deve conter a etapa de auditoria de segurança");
    assert.ok(content.includes("graphify update"), "Deve conter a etapa de verificação AST do Graphify");
  });

  test("verifica existência dos scripts de checagem local pre-commit/pre-push em scripts/", () => {
    const shPath = join(process.cwd(), "scripts", "ci-check.sh");
    const ps1Path = join(process.cwd(), "scripts", "ci-check.ps1");

    assert.equal(existsSync(shPath), true, "O script scripts/ci-check.sh deve existir");
    assert.equal(existsSync(ps1Path), true, "O script scripts/ci-check.ps1 deve existir");

    const shContent = readFileSync(shPath, "utf-8");
    assert.ok(shContent.includes("typecheck"), "ci-check.sh deve executar typecheck");
    assert.ok(shContent.includes("npm test"), "ci-check.sh deve executar testes");

    const ps1Content = readFileSync(ps1Path, "utf-8");
    assert.ok(ps1Content.includes("typecheck"), "ci-check.ps1 deve executar typecheck");
    assert.ok(ps1Content.includes("npm test"), "ci-check.ps1 deve executar testes");
  });
});
