import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validDoctorId } from "../src/domain/patients.js";

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
