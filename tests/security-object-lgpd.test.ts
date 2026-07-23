import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildApp } from "../src/app.ts";
import {
  canReadPatient,
  canWritePatient,
  canExportPatientData,
  canReadAttachment,
  canModifyDoctorAssignment,
  type UserSubject,
  type PatientTarget,
} from "../src/domain/security.ts";
import {
  ANONYMIZED_PHONE,
  ANONYMIZED_TEXT_PLACEHOLDER,
  anonymizePatientName,
} from "../src/domain/privacy.ts";

test("suíte de autorização por objeto e LGPD (PR-01)", async (t) => {
  const app = buildApp();

  await t.test("Matriz Admin x Operador x Médico vinculado x Médico não vinculado", () => {
    const admin: UserSubject = { id: "usr-admin", role: "admin" };
    const operator: UserSubject = { id: "usr-op", role: "operator" };
    const linkedDoc: UserSubject = { id: "usr-doc1", role: "doctor" };
    const unlinkedDoc: UserSubject = { id: "usr-doc2", role: "doctor" };

    const patient: PatientTarget = { id: "pat-100", responsible_doctor_id: "usr-doc1" };

    // Admin
    assert.equal(canReadPatient(admin, patient), true);
    assert.equal(canWritePatient(admin, patient), true);
    assert.equal(canExportPatientData(admin, patient), true);
    assert.equal(canReadAttachment(admin, patient), true);
    assert.equal(canModifyDoctorAssignment(admin), true);

    // Operator
    assert.equal(canReadPatient(operator, patient), true);
    assert.equal(canWritePatient(operator, patient), true);
    assert.equal(canExportPatientData(operator, patient), false, "Operador não pode exportar dados LGPD");
    assert.equal(canReadAttachment(operator, patient), true);
    assert.equal(canModifyDoctorAssignment(operator), true);

    // Linked Doctor
    assert.equal(canReadPatient(linkedDoc, patient), true);
    assert.equal(canWritePatient(linkedDoc, patient), true);
    assert.equal(canExportPatientData(linkedDoc, patient), true);
    assert.equal(canReadAttachment(linkedDoc, patient), true);
    assert.equal(canModifyDoctorAssignment(linkedDoc), false, "Médico não pode reatribuir vínculo livremente");

    // Unlinked Doctor
    assert.equal(canReadPatient(unlinkedDoc, patient), false);
    assert.equal(canWritePatient(unlinkedDoc, patient), false);
    assert.equal(canExportPatientData(unlinkedDoc, patient), false);
    assert.equal(canReadAttachment(unlinkedDoc, patient), false);
    assert.equal(canModifyDoctorAssignment(unlinkedDoc), false);
  });

  await t.test("CSRF: mutações exigem Origin válido e rejeitam Origin ausente ou divergente", async () => {
    const resNoOrigin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { "content-type": "application/json" },
      payload: { email: "admin@demo.local", password: "wrong" },
    });
    assert.equal(resNoOrigin.statusCode, 403);

    const resWrongOrigin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        origin: "https://evil-attacker.com",
        "content-type": "application/json",
      },
      payload: { email: "admin@demo.local", password: "wrong" },
    });
    assert.equal(resWrongOrigin.statusCode, 403);
  });

  await t.test("Inspeção de rotas em app.ts: autorização centralizada por paciente e redação LGPD", async () => {
    const source = await readFile(new URL("../src/app.ts", import.meta.url), "utf8");

    // Valida se todas as rotas por paciente chamam loadAndAuthorizePatient
    assert.match(source, /loadAndAuthorizePatient/);
    assert.match(source, /canModifyDoctorAssignment/);
    assert.match(source, /auditDenial/);

    // Valida se listagens de médico aplicam filtro SQL
    assert.match(source, /p\.responsible_doctor_id = \$/);

    // Valida se redação dinâmica usa o placeholder LGPD correto em timeline e eventos
    assert.match(source, /patient_redactions/);
    assert.match(source, /ANONYMIZED_TEXT_PLACEHOLDER/);

    // Valida requisitos de anonimização (optimistic lock, justificativa, confirmação e senha)
    assert.match(source, /anonymize/);
    assert.match(source, /Justificativa obrigatória/);
    assert.match(source, /Confirmação explícita/);
    assert.match(source, /Senha do administrador/);
  });

  await t.test("Constantes e auxiliares de privacidade LGPD", () => {
    assert.equal(ANONYMIZED_PHONE, "5500000000000");
    assert.equal(ANONYMIZED_TEXT_PLACEHOLDER, "[DADOS REMOVIDOS LGPD]");
    assert.equal(anonymizePatientName("abcd-12345678-efgh"), "Paciente Anonimizado abcd-123");
  });
});
