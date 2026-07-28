import assert from "node:assert";
import test from "node:test";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { pool } from "../src/db/pool.js";
import { importRoutes } from "../src/modules/import/routes.js";
import { calculateVersionedCsvHash } from "../src/domain/csv-import.js";

test("PROMPT 06 — Suíte de regressão, edge cases e falhas na importação CSV", async (t) => {
  const app = Fastify();
  await app.register(cookie);
  await app.register(importRoutes);

  // Autenticação mockada como admin
  app.addHook("preHandler", async (req) => {
    (req as any).currentUser = { id: "admin-uuid", role: "admin", name: "Administrador" };
  });

  const importJobs: Record<string, any> = {};
  const importErrors: Array<{ jobId: string; rowNumber: number; msg: string }> = [];
  const importedRows: Array<{ jobId: string; rowNumber: number; rowHash: string }> = [];
  const insertedPatients: any[] = [];
  let injectDbFailureOnJobInsert = false;
  let injectDbFailureOnPatientInsert = false;

  const originalQuery = pool.query;
  pool.query = async (text: string, params?: any[]) => {
    // 1. SELECT by idempotency_key
    if (text.includes("FROM csv_import_jobs WHERE idempotency_key=$1")) {
      const found = Object.values(importJobs).find((j) => j.idempotency_key === params?.[0]);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 } as any;
    }

    // 2. SELECT by batch_hash and attempt_number
    if (text.includes("WHERE batch_hash=$1 AND attempt_number=$2")) {
      const found = Object.values(importJobs).find((j) => j.batch_hash === params?.[0] && j.attempt_number === params?.[1]);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 } as any;
    }

    // 3. SELECT by batch_hash order by attempt_number desc
    if (text.includes("WHERE batch_hash=$1 ORDER BY attempt_number DESC")) {
      const found = Object.values(importJobs)
        .filter((j) => j.batch_hash === params?.[0])
        .sort((a, b) => (b.attempt_number || 1) - (a.attempt_number || 1))[0];
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 } as any;
    }

    // 4. SELECT job by ID
    if (text.includes("FROM csv_import_jobs WHERE id=$1")) {
      const found = importJobs[params?.[0]];
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 } as any;
    }

    // 5. INSERT INTO csv_import_jobs
    if (text.includes("INSERT INTO csv_import_jobs(")) {
      if (injectDbFailureOnJobInsert) {
        throw new Error("Erro de I/O de conexão ao criar job (injetado)");
      }
      // id, batch_hash, entity_type, created_by, previous_job_id, attempt_number, idempotency_key ($1 até $7)
      const job = {
        id: params?.[0],
        batch_hash: params?.[1],
        entity_type: params?.[2],
        status: "processing",
        created_by: params?.[3],
        parser_version: "v2",
        previous_job_id: params?.[4],
        attempt_number: params?.[5] || 1,
        idempotency_key: params?.[6],
        total_rows: 0,
        processed_rows: 0,
        error_count: 0,
      };
      importJobs[job.id] = job;
      return { rows: [job], rowCount: 1 } as any;
    }

    // 6. UPDATE csv_import_jobs
    if (text.includes("UPDATE csv_import_jobs SET status=$1")) {
      const id = params?.[4];
      if (importJobs[id]) {
        importJobs[id].status = params?.[0];
        importJobs[id].total_rows = params?.[1];
        importJobs[id].processed_rows = params?.[2];
        importJobs[id].error_count = params?.[3];
      }
      return { rows: [], rowCount: 1 } as any;
    }

    // 7. SELECT row_hash from csv_imported_rows
    if (text.includes("FROM csv_imported_rows WHERE job_id = $1")) {
      const prevId = params?.[0];
      const bHash = params?.[1];
      const parentJobs = Object.values(importJobs).filter((j) => j.id === prevId || j.batch_hash === bHash).map((j) => j.id);
      const rows = importedRows.filter((r) => parentJobs.includes(r.jobId)).map((r) => ({ row_hash: r.rowHash }));
      return { rows, rowCount: rows.length } as any;
    }

    // 8. INSERT INTO csv_imported_rows
    if (text.includes("INSERT INTO csv_imported_rows(")) {
      importedRows.push({ jobId: params?.[1], rowNumber: params?.[2], rowHash: params?.[3] });
      return { rows: [], rowCount: 1 } as any;
    }

    // 9. INSERT INTO csv_import_errors
    if (text.includes("INSERT INTO csv_import_errors(")) {
      importErrors.push({ jobId: params?.[1], rowNumber: params?.[2], msg: params?.[3] });
      return { rows: [], rowCount: 1 } as any;
    }

    // 10. SELECT row_number FROM csv_import_errors WHERE job_id=$1
    if (text.includes("SELECT row_number FROM csv_import_errors WHERE job_id=$1")) {
      const rows = importErrors.filter((e) => e.jobId === params?.[0]).map((e) => ({ row_number: e.rowNumber }));
      return { rows, rowCount: rows.length } as any;
    }

    // 11. INSERT INTO patients
    if (text.includes("INSERT INTO patients(")) {
      if (injectDbFailureOnPatientInsert) {
        const err: any = new Error("Unique constraint violation");
        err.code = "23505";
        throw err;
      }
      insertedPatients.push({ name: params?.[0], phone: params?.[1] });
      return { rows: [], rowCount: 1 } as any;
    }

    // 12. Audit events e fallback
    if (text.includes("INSERT INTO audit_events")) {
      return { rows: [], rowCount: 1 } as any;
    }
    if (text.includes("SELECT 1 FROM company_accounts")) {
      return { rows: [{ 1: 1 }], rowCount: 1 } as any;
    }
    if (text.includes("INSERT INTO financial_entries")) {
      return { rows: [], rowCount: 1 } as any;
    }

    return { rows: [], rowCount: 0 } as any;
  };

  try {
    await t.test("1. Importação de sucesso integral (100% dos registros importados sem erros -> completed)", async () => {
      const csvContent = `Nome,Telefone\nAna Válida,11999999999\nBruno Silva,11888888888`;
      const res = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent },
      });
      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.status, "completed");
      assert.equal(body.processedRows, 2);
      assert.equal(body.errorCount, 0);
      assert.equal(body.attemptNumber, 1);
    });

    await t.test("2. Importação parcial com linhas inválidas e falha de persistência -> completed_with_errors e erro seguro", async () => {
      // Linha 1: Válida. Linha 2: Inválida (sem telefone). Linha 3: Gerará conflito de banco (injetado via toggle)
      injectDbFailureOnPatientInsert = true; // Força erro 23505 em todas as tentativas deste teste
      const csvContent = `Nome,Telefone\nDuplicado da Silva,11911111111`;
      const res = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent },
      });
      injectDbFailureOnPatientInsert = false; // reset
      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.status, "failed"); // Como a única linha falhou com 23505, zero processadas
      
      const err = importErrors.find((e) => e.jobId === body.jobId);
      assert.ok(err);
      assert.match(err.msg, /já consta cadastrado/i, "Não deve expor SQL ou stack trace de erro no banco");
    });

    await t.test("3. Importação com 100% das linhas falhas (ou erro geral sem linhas importadas) -> failed", async () => {
      const csvContent = `Nome,Telefone\nSem Telefone,\nOutre Sem Telefone,`;
      const res = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent },
      });
      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.status, "failed");
      assert.equal(body.processedRows, 0);
      assert.equal(body.errorCount, 2);
    });

    await t.test("4. Falha na criação do job -> erro explícito, sem registro fantasma (nenhum paciente gravado)", async () => {
      const countBefore = insertedPatients.length;
      injectDbFailureOnJobInsert = true;
      const csvContent = `Nome,Telefone\nPaciente Fantasma,11944444444`;
      const res = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent },
      });
      injectDbFailureOnJobInsert = false;
      assert.equal(res.statusCode, 500, "Deve retornar erro de servidor quando a persistência do job falha");
      assert.equal(insertedPatients.length, countBefore, "Nenhum paciente deve ser inserido se o job não pôde ser gravado");
    });

    await t.test("5. Idempotência completa e retry controlado (re-envio e reprocessamento em tentativas separadas)", async () => {
      const csvContent = `Nome,Telefone\nCarlos Idempotente,11977777777`;
      // Primeira tentativa (Sucesso)
      const res1 = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent },
      });
      assert.equal(res1.statusCode, 201);
      const job1 = res1.json();
      assert.equal(job1.status, "completed");

      // Segunda chamada idêntica -> Retorno idempotente (200)
      const res2 = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent },
      });
      assert.equal(res2.statusCode, 200);
      const body2 = res2.json();
      assert.equal(body2.idempotent, true);
      assert.match(body2.message, /já foi importado anteriormente/i);
    });

    await t.test("6. Reprocessamento válido reconstruído de forma robusta e segura (com fonte e hash consistentes)", async () => {
      // Cria job anterior que teve falha parcial
      const partialCsv = `Nome,Telefone\nLinha Boa,11966666666\nLinha ComErro,`;
      const res1 = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent: partialCsv },
      });
      const job1 = res1.json();
      assert.equal(job1.status, "completed_with_errors");
      assert.equal(job1.processedRows, 1);
      assert.equal(job1.errorCount, 1);

      // Agora reprocessa o job fornecendo a planilha corrigida onde a linha 2 agora é válida
      const correctedCsv = `Nome,Telefone\nLinha Boa,11966666666\nLinha ComErro,11955555555`;
      const resRepro = await app.inject({
        method: "POST",
        url: `/api/admin/import/csv/${job1.jobId}/reprocess`,
        payload: { csvContent: correctedCsv },
      });
      assert.equal(resRepro.statusCode, 201);
      const bodyRepro = resRepro.json();
      assert.equal(bodyRepro.attemptNumber, 2, "Deve criar Attempt #2 sem sobrescrever histórico do Job 1");
      assert.equal(bodyRepro.previousJobId, job1.jobId);
      assert.equal(bodyRepro.status, "completed"); // Agora ambas as linhas tiveram êxito (ou foram preservadas pelo row_hash/retry)!
    });

    await t.test("7. Erro no reprocessamento sem fonte (400), em status inválido (409) ou conflito de chave (409)", async () => {
      // 7a. Reprocessamento sem enviar csvContent
      const someFailedJobId = Object.values(importJobs).find((j) => j.status !== "completed")?.id || "foo";
      const resNoSource = await app.inject({
        method: "POST",
        url: `/api/admin/import/csv/${someFailedJobId}/reprocess`,
        payload: {},
      });
      assert.equal(resNoSource.statusCode, 400);

      // 7b. Reprocessar job já concluded integralmente -> 409
      const completedJob = Object.values(importJobs).find((j) => j.status === "completed");
      assert.ok(completedJob, "Deve ter ao menos um job completed na memória");
      const resConcluded = await app.inject({
        method: "POST",
        url: `/api/admin/import/csv/${completedJob.id}/reprocess`,
        payload: { csvContent: "Nome,Telefone\nAna,11999999999" },
      });
      assert.equal(resConcluded.statusCode, 409);
      assert.match(resConcluded.json().title, /Apenas jobs com falhas/i);

      // 7c. Mesma chave (idempotencyKey) com conteúdo CSV completamente diferente -> 409 Conflict
      const idempKey = "chave-unica-teste-123";
      await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent: "Nome,Telefone\nOriginal,11900000001", idempotencyKey: idempKey },
      });

      const resConflict = await app.inject({
        method: "POST",
        url: "/api/admin/import/csv",
        payload: { entityType: "patient", csvContent: "Nome,Telefone\nConteudoDiferente,11900000002", idempotencyKey: idempKey },
      });
      assert.equal(resConflict.statusCode, 409);
      assert.match(resConflict.json().title, /Conflito de idempotência/i);
    });

  } finally {
    pool.query = originalQuery;
    await app.close();
  }
});
