import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

describe("CI, runtime e higiene do repositório", () => {
  test("alinha todos os ambientes em Node 24", () => {
    assert.match(read("package.json"), /"node"\s*:\s*">=24 <25"/);
    assert.match(read("package-lock.json"), /"node"\s*:\s*">=24 <25"/);
    assert.match(read("Dockerfile"), /^FROM node:24-alpine/m);
    assert.match(read(".github", "workflows", "ci.yml"), /node-version:\s*24/);
    assert.equal(read(".nvmrc").trim(), "24");
    assert.equal(read(".node-version").trim(), "24");
    assert.match(read("render.yaml"), /key:\s*NODE_VERSION[\s\S]*?value:\s*"24"/);
  });

  test("executa CI em PR, push da main e acionamento manual", () => {
    const workflow = read(".github", "workflows", "ci.yml");
    assert.match(workflow, /pull_request:/);
    assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/);
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /group:\s*fonolife-/);
    assert.match(workflow, /npm run ci:check:full/);
    assert.match(workflow, /if:\s*failure\(\)/);
    assert.match(workflow, /docker-compose\.log/);
  });

  test("mantém ambientes de produção e demo separados", () => {
    assert.match(read("compose.yaml"), /NODE_ENV:\s*\$\{NODE_ENV:-development\}/);
    assert.match(read("compose.yaml"), /APP_ENV:\s*\$\{APP_ENV:-demo\}/);
    assert.match(read("render.yaml"), /key:\s*NODE_ENV[\s\S]*?value:\s*production/);
    assert.match(read("render.yaml"), /key:\s*APP_ENV[\s\S]*?value:\s*production/);
    assert.match(read("render.yaml"), /name:\s*fonolife-demo[\s\S]*?name:\s*fonolife-demo-db/);
  });

  test("mantém gates rápido e completo em uma fonte de verdade", () => {
    const shPath = join(root, "scripts", "ci-check.sh");
    const ps1Path = join(root, "scripts", "ci-check.ps1");
    assert.equal(existsSync(shPath), true);
    assert.equal(existsSync(ps1Path), true);

    const sh = read("scripts", "ci-check.sh");
    for (const gate of [
      "repo:hygiene",
      "typecheck",
      "npm test",
      "npm run build",
      "npm audit --audit-level=high",
      "npx --yes @sentropic/graphify@0.17.1 update",
      "docker compose",
      "dist/db/migrate.js",
      "dist/db/seed.js",
      "demo:reset",
      "assert_immutable_ledger",
      "logs >docker-compose.log",
      "test:e2e",
    ]) {
      assert.ok(sh.includes(gate), `ci-check.sh deve conter ${gate}`);
    }
    assert.match(read("scripts", "ci-check.ps1"), /scripts\/ci-check\.sh/);
  });

  test("não versiona estado local do Graphify, m1nd ou hooks pessoais", () => {
    const ignore = read(".gitignore");
    assert.match(ignore, /^\.graphify\/$/m);
    assert.match(ignore, /^\.agents\/$/m);
    assert.match(ignore, /^\.m1nd\/$/m);
    assert.match(ignore, /^checkpoint-store\/$/m);
    assert.match(ignore, /^\.codex\/hooks\.json$/m);

    const hygiene = read("scripts", "check-repository-hygiene.mjs");
    assert.match(hygiene, /caminho absoluto do Windows/);
    assert.match(hygiene, /caminho pessoal Unix/);
    assert.match(hygiene, /runtime deve usar Node 24/);
    assert.match(hygiene, /boot_memory_state/);
  });
});
