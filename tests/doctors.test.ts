import test from "node:test";
import assert from "node:assert/strict";
import { validDoctorId } from "../src/domain/patients.js";

test("valida vínculo de médico responsável pelo paciente", () => {
  assert.equal(validDoctorId("11111111-1111-1111-1111-111111111111"), true);
  assert.equal(validDoctorId(null), true);
  assert.equal(validDoctorId(undefined), true);
  assert.equal(validDoctorId("id-invalido-curto"), false);
});
