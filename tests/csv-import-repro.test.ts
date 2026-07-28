import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { hashToken } from "../src/domain/security.js";

test("PROMPT 06 — Reproduzir falhas do ciclo de vida da importação CSV: status parcial falso, reprocessamento oco e falhas engolidas", async (t) => {
  const app = buildApp();
  const originalQuery = pool.query.bind(pool);
  const originalConnect = pool.connect.bind(pool);

  let insertedPatients: any[] = [];
  let importJobs: Record<string, any> = {};
  let importErrors: any[] = [];
  let injectDbFailureOnJobInsert = false;

  const handleQuery = async (sql: any, params?: any[]) => {
    const text = typeof sql === "string" ? sql : sql?.text || "";

    if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (text.includes("FROM user_sessions")) {
      const hash = params?.[0];
      if (hash === hashToken("token-admin")) {
        return {
          rows: [{ id: "usr-admin", name: "Admin Mock", email: "admin@fonolife.local", role: "admin", must_change_password: false }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    }

    if (text.includes("SELECT id,entity_type,status")) {
      const hash = params?.[0];
      const found = Object.values(importJobs).find((j) => j.batch_hash === hash);
      if (found) {
        return { rows: [found], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (text.includes("INSERT INTO csv_import_jobs")) {
      if (injectDbFailureOnJobInsert) {
        const err = new Error("Erro de I/O no banco de dados (injetado)");
        (err as any).code = "58000"; // Erro genérico, NÃO é 23505 (unique violation)
        throw err;
      }
      const job = {
        id: params?.[0],
        batch_hash: params?.[1],
        entity_type: params?.[2],
        status: "processing",
        total_rows: 0,
        processed_rows: 0,
        error_count: 0,
        created_by: params?.[3],
      };
      importJobs[job.id] = job;
      return { rows: [], rowCount: 1 };
    }

    if (text.includes("UPDATE csv_import_jobs SET status=$1")) {
      // No código legado: status=$1,total_rows=$2,processed_rows=$3,error_count=$4,completed_at=now() WHERE id=$5
      const status = params?.[0];
      const jobId = params?.[4] || params?.[0]; // no reprocess legado é WHERE id=$1 com string fixa
      if (text.includes("status='processing'") && params?.[0]) {
        if (importJobs[params[0]]) importJobs[params[0]].status = "processing";
      } else if (params?.[4] && importJobs[params[4]]) {
        const j = importJobs[params[4]];
        j.status = status;
        j.total_rows = params?.[1];
        j.processed_rows = params?.[2];
        j.error_count = params?.[3];
      }
      return { rows: [], rowCount: 1 };
    }

    if (text.includes("INSERT INTO csv_import_errors")) {
      importErrors.push({ id: params?.[0], jobId: params?.[1], rowNumber: params?.[2], msg: params?.[3] });
      return { rows: [], rowCount: 1 };
    }

    if (text.includes("INSERT INTO patients")) {
      insertedPatients.push({ id: params?.[0], name: params?.[1], phone: params?.[2] });
      return { rows: [], rowCount: 1 };
    }

    if (text.includes("SELECT id, status FROM csv_import_jobs WHERE id=$1")) {
      const j = importJobs[params?.[0]];
      return { rows: j ? [j] : [], rowCount: j ? 1 : 0 };
    }

    if (text.includes("DELETE FROM csv_import_errors")) {
      importErrors = importErrors.filter((e) => e.jobId !== params?.[0]);
      return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  };

  pool.query = handleQuery as any;
  pool.connect = async () => ({
    query: handleQuery,
    release: () => {},
  }) as any;

  const headers = {
    origin: "http://localhost:5173",
    cookie: "fonolife_session=token-admin",
    "content-type": "application/json",
  };

  try {
    await t.test("1. Importação com sucesso parcial (1 válida, 1 inválida) deve retornar 'completed_with_errors' (atualmente falha retornando 'completed')", async () => {
      const csvContent = "nome,telefone\nAna Válida,11988887777\n,123"; // linha 2 válida, linha 3 inválida (nome vazio e tel curto)
      const res = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        headers,
        payload: { entityType: "patient", csvContent },
      });

      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.processedRows, 1);
      assert.equal(body.errorCount, 1);
      // No código falho, retorna 'completed'. O invariante exige 'completed_with_errors' para parcial.
      assert.equal(body.status, "completed_with_errors", `Status deveria ser completed_with_errors, mas foi ${body.status}`);
    });

    await t.test("2. Falha grave ao criar job no banco não deve ser engolida nem inserir dados gerando resposta 201 falsa", async () => {
      injectDbFailureOnJobInsert = true;
      insertedPatients = [];
      const csvContent = "nome,telefone\nCarlos Teste,11977776666";
      const res = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        headers,
        payload: { entityType: "patient", csvContent },
      });

      // No código falho, o catch {} silencia a exceção, insere o paciente sem job e retorna 201!
      assert.equal(insertedPatients.length, 0, "Nenhum dado deveria ter sido inserido no banco se a criação do job falhou!");
      assert.notEqual(res.statusCode, 201, "Não pode retornar 201 sucesso falso quando o banco falha!");
      injectDbFailureOnJobInsert = false;
    });

    await t.test("3. Endpoint de reprocessamento não deve apenas apagar erros e marcar 'processing' sem reler fonte ou reprocessar linhas", async () => {
      const failedJobId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      importJobs[failedJobId] = { id: failedJobId, status: "failed", entity_type: "patient" };
      importErrors.push({ jobId: failedJobId, rowNumber: 2, msg: "Erro antigo" });

      const res = await app.inject({
        method: "POST",
        url: `/api/admin/import/csv/${failedJobId}/reprocess`,
        headers,
        payload: {}, // Sem fornecer fonte / sem storage real
      });

      // Se não há fonte para reprocessar (nem fornecida na request nem em storage), deve retornar erro claro 400/422!
      // No código falho, ele apenas apaga os erros, põe status processing e retorna 200 reprocessed!
      assert.notEqual(res.statusCode, 200, "Deveria falhar com erro claro ao reprocessar sem fonte, mas retornou 200 oco!");
      assert.equal(importErrors.length, 1, "Não deve apagar evidência histórica de erro antes de um retry real!");
    });
  } finally {
    pool.query = originalQuery;
    pool.connect = originalConnect;
    await app.close();
  }
});
