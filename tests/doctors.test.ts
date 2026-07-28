import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validDoctorId } from "../src/domain/patients.js";
import { lastDayOfMonth } from "../src/domain/calendar.js";
import { buildApp } from "../src/app.ts";
import { pool } from "../src/db/pool.js";

test("valida vínculo de médico responsável pelo paciente", () => {
  assert.equal(validDoctorId("11111111-1111-1111-1111-111111111111"), true);
  assert.equal(validDoctorId(null), true);
  assert.equal(validDoctorId(undefined), true);
  assert.equal(validDoctorId("id-invalido-curto"), false);
});

test("novos vínculos aceitam somente médicos ativos", () => {
  const doctorRoutes = readFileSync("src/modules/doctors/routes.ts", "utf8");
  const patientRoutes = readFileSync("src/modules/patients/routes.ts", "utf8");
  assert.match(doctorRoutes, /role='doctor' AND active/);
  assert.doesNotMatch(doctorRoutes, /role IN \('doctor', 'admin'\)/);
  assert.match(patientRoutes, /role='doctor' AND active/);
  assert.match(patientRoutes, /Selecione um médico ativo/);
});

test("calcula último dia do mês corretamente para anos bissextos e meses de 28, 29, 30 e 31 dias", () => {
  assert.equal(lastDayOfMonth(2026, 1), 31); // Jan
  assert.equal(lastDayOfMonth(2026, 2), 28); // Fev (não bissexto)
  assert.equal(lastDayOfMonth(2028, 2), 29); // Fev (bissexto)
  assert.equal(lastDayOfMonth(2032, 2), 29); // Fev (bissexto)
  assert.equal(lastDayOfMonth(2026, 4), 30); // Abr
  assert.equal(lastDayOfMonth(2026, 6), 30); // Jun
  assert.equal(lastDayOfMonth(2026, 9), 30); // Set
  assert.equal(lastDayOfMonth(2026, 11), 30); // Nov
  assert.equal(lastDayOfMonth(2026, 12), 31); // Dez
});

test("GET /api/doctor/schedule retorna 200 para todos os 12 meses do ano corrente e próximo sem erro 500", async () => {
  const app = buildApp();
  const originalQuery = pool.query.bind(pool);
  
  pool.query = (async (sql: any, params?: any[]) => {
    const queryText = typeof sql === "string" ? sql : sql?.text || "";
    if (queryText.includes("FROM user_sessions")) {
      return {
        rows: [{
          id: "admin-id-mock",
          name: "Dr. Admin Test",
          email: "admin@fonolife.local",
          role: "admin",
          license_number: "CRM00000",
          specialty: "Fonoaudiologia",
          must_change_password: false,
        }],
        rowCount: 1,
      };
    }
    if (queryText.includes("FROM follow_up_tasks") || queryText.includes("FROM patient_events")) {
      const endDate = params?.[1];
      if (typeof endDate === "string") {
        const parts = endDate.split("-").map(Number);
        const month = parts[1];
        const day = parts[2];
        if (day === 31 && [2, 4, 6, 9, 11].includes(month)) {
          throw new Error('invalid value "31" for field "day" in timestamp');
        }
      }
      return { rows: [], rowCount: 0 };
    }
    return { rows: [], rowCount: 0 };
  }) as any;

  try {
    const headers = { cookie: "fonolife_session=token-mock", origin: "http://localhost:5173" };

    // Testa explicitamente meses que quebravam antes com erro 500 de conversão do PostgreSQL
    for (const m of [2, 4, 6, 9, 11]) {
      const res = await app.inject({ method: "GET", url: `/api/doctor/schedule?year=2026&month=${m}`, headers });
      assert.equal(res.statusCode, 200, `Falhou para o mês ${m} de 2026 com código ${res.statusCode}`);
    }

    // Testa os 12 meses do ano corrente e do próximo ano (incluindo bissextos)
    const currentYear = new Date().getFullYear();
    for (const year of [currentYear, currentYear + 1, 2028]) {
      for (let month = 1; month <= 12; month++) {
        const res = await app.inject({ method: "GET", url: `/api/doctor/schedule?year=${year}&month=${month}`, headers });
        assert.equal(res.statusCode, 200, `Falhou para ${year}-${month}`);
        const body = JSON.parse(res.payload);
        assert.equal(body.year, year);
        assert.equal(body.month, month);
        assert.ok(Array.isArray(body.tasks));
        assert.ok(Array.isArray(body.events));
      }
    }
  } finally {
    pool.query = originalQuery;
    await app.close();
  }
});

test("GET /api/doctor/schedule rejeita mês ou ano inválidos com 400", async () => {
  const app = buildApp();
  const originalQuery = pool.query.bind(pool);
  pool.query = (async (sql: any) => {
    const queryText = typeof sql === "string" ? sql : sql?.text || "";
    if (queryText.includes("FROM user_sessions")) {
      return {
        rows: [{
          id: "admin-id-mock-2",
          name: "Dr. Admin Test 2",
          email: "admin2@fonolife.local",
          role: "admin",
          license_number: "CRM00002",
          specialty: "Fonoaudiologia",
          must_change_password: false,
        }],
        rowCount: 1,
      };
    }
    return { rows: [], rowCount: 0 };
  }) as any;

  try {
    const headers = { cookie: "fonolife_session=token-mock-val", origin: "http://localhost:5173" };
    const invalidQueries = [
      "?year=2026&month=0",
      "?year=2026&month=13",
      "?year=2026&month=-5",
      "?year=2026&month=abc",
      "?year=99999&month=6",
      "?year=1900&month=6",
      "?year=NaN&month=6",
    ];

    for (const query of invalidQueries) {
      const res = await app.inject({ method: "GET", url: `/api/doctor/schedule${query}`, headers });
      assert.equal(res.statusCode, 400, `Deveria rejeitar com 400 a query: ${query}`);
      const body = JSON.parse(res.payload);
      assert.equal(body.title, "Ano ou mês inválido");
    }
  } finally {
    pool.query = originalQuery;
    await app.close();
  }
});
