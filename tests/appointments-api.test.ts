import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";
import { pool } from "../src/db/pool.js";

test("API Agenda Mensal e Mutações - Módulo Appointments", async (t) => {
  const app = buildApp();

  await t.test("GET /api/appointments: Admin filtra por doctorId e Doctor só vê a si mesmo", async () => {
    const originalQuery = pool.query.bind(pool);
    let capturedValues: any[] = [];
    
    // Mock authentication preHandler and pool
    pool.query = (async (sql: any, values: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("FROM user_sessions")) {
        // mock auth session
        return {
          rows: [{ id: "mock-doctor", name: "Dr Mock", email: "doc@test.com", role: "doctor", active: true }],
          rowCount: 1,
        };
      }
      if (text.includes("SELECT") && text.includes("FROM appointments")) {
        capturedValues = values;
        return {
          rows: [
            {
              id: "app-1",
              patientId: "pat-1",
              doctorId: "mock-doctor",
              scheduledAt: "2026-08-15T10:00:00Z",
              durationMinutes: 30,
              type: "consulta",
              status: "scheduled",
              notes: ""
            }
          ],
          rowCount: 1
        };
      }
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      // 1. Doctor requistando com doctorId de OUTRO medico (deve ser ignorado e usar o dele)
      const resDoctor = await app.inject({
        method: "GET",
        url: "/api/appointments?year=2026&month=8&doctorId=outromedico",
        headers: { origin: "http://localhost:5173", "content-type": "application/json", cookie: "fonolife_session=token-mock" },
      });
      assert.equal(resDoctor.statusCode, 200);
      assert.equal(capturedValues.includes("mock-doctor"), true, "Doctor deve ter forçado seu próprio ID");

      // 2. Admin requisitando com filtro
      pool.query = (async (sql: any, values: any) => {
        const text = typeof sql === "string" ? sql : sql?.text || "";
        if (text.includes("FROM user_sessions")) return { rows: [{ id: "mock-admin", role: "admin", active: true }], rowCount: 1 };
        if (text.includes("FROM appointments")) {
          capturedValues = values;
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      }) as any;

      const resAdmin = await app.inject({
        method: "GET",
        url: "/api/appointments?year=2026&month=8&doctorId=dr-especifico",
        headers: { origin: "http://localhost:5173", cookie: "fonolife_session=token-admin" },
      });
      assert.equal(resAdmin.statusCode, 200);
      assert.equal(capturedValues.includes("dr-especifico"), true, "Admin pode filtrar por ID específico");
      
    } finally {
      pool.query = originalQuery;
    }
  });

  await t.test("POST /api/appointments: validação rigorosa 400 e 404, sem erro 500", async () => {
    const originalQuery = pool.query.bind(pool);
    const originalConnect = pool.connect.bind(pool);
    
    pool.connect = (async () => ({ query: pool.query, release: () => {} })) as any;
    pool.query = (async (sql: any, values: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("FROM user_sessions")) return { rows: [{ id: "mock-admin", role: "admin", active: true }], rowCount: 1 };
      
      // Simular paciente não encontrado
      if (text.includes("FROM patients WHERE id = $1")) return { rowCount: 0, rows: [] };
      if (text.includes("BEGIN") || text.includes("ROLLBACK")) return { rowCount: 0, rows: [] };
      
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      // Falta campos obrigatórios
      const resVazio = await app.inject({
        method: "POST",
        url: "/api/appointments",
        headers: { origin: "http://localhost:5173", cookie: "fonolife_session=token-admin" },
        payload: {}
      });
      assert.equal(resVazio.statusCode, 400);

      // Paciente não encontrado (404)
      const resPat404 = await app.inject({
        method: "POST",
        url: "/api/appointments",
        headers: { origin: "http://localhost:5173", cookie: "fonolife_session=token-admin" },
        payload: { patientId: "invalido", doctorId: "doc", scheduledAt: "2026-08-01", durationMinutes: 30, type: "t", status: "scheduled" }
      });
      assert.equal(resPat404.statusCode, 404);

    } finally {
      pool.query = originalQuery;
      pool.connect = originalConnect;
    }
  });

  await t.test("GET /api/appointments: retorna 400 para mês ou ano inválidos", async () => {
    const originalQuery = pool.query.bind(pool);
    pool.query = (async (sql: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("FROM user_sessions")) return { rows: [{ id: "mock-admin", role: "admin", active: true }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/appointments?year=2026&month=13",
        headers: { origin: "http://localhost:5173", cookie: "fonolife_session=token-admin" },
      });
      assert.equal(res.statusCode, 400);

      const res2 = await app.inject({
        method: "GET",
        url: "/api/appointments?year=abc&month=8",
        headers: { origin: "http://localhost:5173", cookie: "fonolife_session=token-admin" },
      });
      assert.equal(res2.statusCode, 400);
    } finally {
      pool.query = originalQuery;
    }
  });

  await t.test("PATCH /api/appointments/:id: cancela agendamento validando acesso", async () => {
    const originalQuery = pool.query.bind(pool);
    const originalConnect = pool.connect.bind(pool);
    
    let updatedValues: any[] = [];

    pool.connect = (async () => ({ query: pool.query, release: () => {} })) as any;
    pool.query = (async (sql: any, values: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("FROM user_sessions")) return { rows: [{ id: "mock-doctor", role: "doctor", active: true }], rowCount: 1 };
      
      if (text.includes("SELECT doctor_id FROM appointments")) {
        return { rows: [{ doctor_id: "mock-doctor" }], rowCount: 1 };
      }
      if (text.includes("UPDATE appointments SET")) {
        updatedValues = values;
        return { rows: [{ id: "app-1", status: "cancelled" }], rowCount: 1 };
      }
      
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/appointments/app-1",
        headers: { origin: "http://localhost:5173", cookie: "fonolife_session=token-doc" },
        payload: { status: "cancelled" }
      });
      assert.equal(res.statusCode, 200);
      assert.equal(updatedValues.includes("cancelled"), true);
      assert.equal(updatedValues.includes("app-1"), true);
    } finally {
      pool.query = originalQuery;
      pool.connect = originalConnect;
      await app.close();
    }
  });
});
