import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildApp } from "../src/app.ts";

describe("isolamento do ambiente demonstrativo", () => {
  test("não registra rota demo fora de APP_ENV=demo", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/demo/session",
      headers: { origin: "http://localhost:5173" },
      payload: { role: "admin" },
    });
    assert.equal(response.statusCode, 404);
    await app.close();
  });

  test("bundle web não contém credenciais demonstrativas conhecidas", () => {
    const source = readFileSync("web/src/main.tsx", "utf8");
    for (const credential of ["admin123", "operador123", "medico123", "admin@demo.local", "operador@demo.local"]) {
      assert.equal(source.includes(credential), false, `credencial exposta: ${credential}`);
    }
    assert.match(source, /\/api\/demo\/session/);
  });

  test("produção recusa qualquer configuração demo", () => {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "-e", "import('./src/config.ts')"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          APP_ENV: "production",
          NODE_ENV: "production",
          DEMO_MODE: "true",
          ATTACHMENT_STORAGE_PROVIDER: "s3",
          ATTACHMENT_SCANNER_PROVIDER: "clamav",
          S3_ACCESS_KEY_ID: "synthetic",
          S3_SECRET_ACCESS_KEY: "synthetic",
        },
        encoding: "utf8",
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(`${result.stderr}${result.stdout}`, /demo features cannot be enabled in production/);
  });
  test("seed demonstrativa é idempotente", () => {
    const runSeed = () => spawnSync(process.execPath, ["--import", "tsx", "src/db/seed.ts"], {
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        APP_ENV: "demo",
        DATABASE_URL: process.env.DATABASE_URL || "postgres://fonolife:fonolife@localhost:5432/fonolife_demo"
      },
      encoding: "utf8",
    });

    const run1 = runSeed();
    assert.equal(run1.status, 0, `Primeira execução da seed não deve falhar. Stderr: ${run1.stderr} Stdout: ${run1.stdout}`);
    
    const run2 = runSeed();
    assert.equal(run2.status, 0, `Segunda execução da seed não deve falhar (idempotência). Stderr: ${run2.stderr}`);
  });
});
