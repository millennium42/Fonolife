import test from 'node:test';
import assert from 'node:assert/strict';
import { isOneOf, normalizePhone, PATIENT_EVENT_TYPES, PATIENT_STATUSES, validPatientPhone } from '../src/domain/patients.js';
import { buildApp } from '../src/app.ts';
import { pool } from '../src/db/pool.js';

test('valida CRM', () => {
  assert.equal(normalizePhone('(11) 99999-1234'), '11999991234');
  assert.equal(validPatientPhone('11999991234'), true);
  assert.equal(isOneOf('new_lead', PATIENT_STATUSES), true);
  assert.equal(isOneOf('clinical_note', PATIENT_EVENT_TYPES), true);
});

test("PATCH /api/patients/:id preserva responsible_doctor_id quando o campo é omitido no corpo da requisição", async () => {
  const app = buildApp();
  const originalQuery = pool.query.bind(pool);
  let capturedDoctorId: any = "nao-executou";

  pool.query = (async (sql: any, params?: any[]) => {
    const text = typeof sql === "string" ? sql : sql?.text || "";
    if (text.includes("SELECT") && text.includes("FROM user_sessions")) {
      return {
        rows: [{
          id: "admin-test-id",
          name: "Admin Tester",
          email: "admin@fonolife.local",
          role: "admin",
          must_change_password: false,
          active: true,
        }],
        rowCount: 1,
      };
    }
    if (text.includes("SELECT id, responsible_doctor_id")) {
      return {
        rows: [{
          id: "pat-100",
          responsible_doctor_id: "doc-orig-1",
          assigned_user_id: null,
          archived_at: null,
          anonymized_at: null,
        }],
        rowCount: 1,
      };
    }
    if (text.includes("UPDATE patients SET")) {
      capturedDoctorId = params?.[9];
      return {
        rows: [{ id: "pat-100", version: 2 }],
        rowCount: 1,
      };
    }
    if (text.includes("INSERT INTO audit_events")) {
      return { rowCount: 1, rows: [] };
    }
    return { rows: [], rowCount: 0 };
  }) as any;

  try {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/patients/pat-100",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
        cookie: "fonolife_session=mock-token",
      },
      payload: {
        name: "Paciente Atualizado",
        phone: "11999999999",
        contactSource: "instagram",
        status: "follow_up",
        version: 1,
      },
    });

    assert.equal(res.statusCode, 200, `Esperava status 200, recebeu ${res.statusCode}: ${res.payload}`);
    assert.equal(capturedDoctorId, "doc-orig-1", "Deveria ter mantido doc-orig-1 como responsible_doctor_id");
  } finally {
    pool.query = originalQuery;
    await app.close();
  }
});

test("PATCH /api/patients/:id com responsibleDoctorId: null limpa explicitamente o vínculo com o médico", async () => {
  const app = buildApp();
  const originalQuery = pool.query.bind(pool);
  let capturedDoctorId: any = "nao-executou";

  pool.query = (async (sql: any, params?: any[]) => {
    const text = typeof sql === "string" ? sql : sql?.text || "";
    if (text.includes("SELECT") && text.includes("FROM user_sessions")) {
      return {
        rows: [{
          id: "admin-test-id",
          name: "Admin Tester",
          email: "admin@fonolife.local",
          role: "admin",
          must_change_password: false,
          active: true,
        }],
        rowCount: 1,
      };
    }
    if (text.includes("SELECT id, responsible_doctor_id")) {
      return {
        rows: [{
          id: "pat-100",
          responsible_doctor_id: "doc-orig-1",
          assigned_user_id: null,
          archived_at: null,
          anonymized_at: null,
        }],
        rowCount: 1,
      };
    }
    if (text.includes("UPDATE patients SET")) {
      capturedDoctorId = params?.[9];
      return {
        rows: [{ id: "pat-100", version: 2 }],
        rowCount: 1,
      };
    }
    if (text.includes("INSERT INTO audit_events")) {
      return { rowCount: 1, rows: [] };
    }
    return { rows: [], rowCount: 0 };
  }) as any;

  try {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/patients/pat-100",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
        cookie: "fonolife_session=mock-token",
      },
      payload: {
        name: "Paciente Atualizado",
        phone: "11999999999",
        contactSource: "instagram",
        status: "follow_up",
        responsibleDoctorId: null,
        version: 1,
      },
    });

    assert.equal(res.statusCode, 200, `Esperava status 200, recebeu ${res.statusCode}: ${res.payload}`);
    assert.equal(capturedDoctorId, null, "Deveria ter alterado para null como requested em responsibleDoctorId: null");
  } finally {
    pool.query = originalQuery;
    await app.close();
  }
});

test("PATCH /api/patients/:id preserva vínculo de médico desativado quando o campo é omitido na alteração de outro campo", async () => {
  const app = buildApp();
  const originalQuery = pool.query.bind(pool);
  let capturedDoctorId: any = "nao-executou";
  let checkDoctorCalled = false;

  pool.query = (async (sql: any, params?: any[]) => {
    const text = typeof sql === "string" ? sql : sql?.text || "";
    if (text.includes("SELECT") && text.includes("FROM user_sessions")) {
      return {
        rows: [{
          id: "admin-test-id",
          name: "Admin Tester",
          email: "admin@fonolife.local",
          role: "admin",
          must_change_password: false,
          active: true,
        }],
        rowCount: 1,
      };
    }
    if (text.includes("SELECT id, responsible_doctor_id")) {
      return {
        rows: [{
          id: "pat-100",
          responsible_doctor_id: "doc-inativo-99",
          assigned_user_id: null,
          archived_at: null,
          anonymized_at: null,
        }],
        rowCount: 1,
      };
    }
    if (text.includes("FROM users WHERE id=$1 AND role='doctor'")) {
      checkDoctorCalled = true;
      return { rows: [], rowCount: 0 }; // simulando que o médico está desativado (active=false)
    }
    if (text.includes("UPDATE patients SET")) {
      capturedDoctorId = params?.[9];
      return {
        rows: [{ id: "pat-100", version: 2 }],
        rowCount: 1,
      };
    }
    if (text.includes("INSERT INTO audit_events")) {
      return { rowCount: 1, rows: [] };
    }
    return { rows: [], rowCount: 0 };
  }) as any;

  try {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/patients/pat-100",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
        cookie: "fonolife_session=mock-token",
      },
      payload: {
        name: "Paciente Atualizado",
        phone: "11988887777", // alterou apenas telefone
        contactSource: "instagram",
        status: "follow_up",
        version: 1,
      },
    });

    assert.equal(res.statusCode, 200, `Esperava status 200, recebeu ${res.statusCode}: ${res.payload}`);
    assert.equal(checkDoctorCalled, false, "Não deveria ter checado validação do médico pois o campo foi omitido");
    assert.equal(capturedDoctorId, "doc-inativo-99", "Deveria ter mantido o médico inativo no vínculo existente");
  } finally {
    pool.query = originalQuery;
    await app.close();
  }
});
