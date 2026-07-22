import test from "node:test";
import assert from "node:assert/strict";
import {
  ANONYMIZED_PHONE,
  ANONYMIZED_TEXT_PLACEHOLDER,
  anonymizePatientName,
  formatLgpdExportPackage,
  isAnonymized,
} from "../src/domain/privacy.js";

test("gera nome pseudonimizado seguro com base no UUID", () => {
  const name = anonymizePatientName("12345678-abcd-efgh-ijkl-123456789012");
  assert.equal(name, "Paciente Anonimizado 12345678");
  assert.equal(isAnonymized(name), true);
  assert.equal(isAnonymized("Maria Silva"), false);
});

test("constantes de anonimização possuem placeholders válidos", () => {
  assert.equal(ANONYMIZED_PHONE, "5500000000000");
  assert.equal(ANONYMIZED_TEXT_PLACEHOLDER, "[DADOS REMOVIDOS LGPD]");
});

test("formata pacote completo de portabilidade LGPD em JSON", () => {
  const patient = {
    id: "12345678-1111-1111-1111-111111111111",
    name: "João da Silva",
    phone: "11999998888",
    created_at: new Date().toISOString(),
  };
  const pkg = formatLgpdExportPackage(patient, [], [], [], []);
  assert.ok(pkg.exportMetadata.exportedAt);
  assert.equal(pkg.patientProfile.name, "João da Silva");
  assert.equal(pkg.patientProfile.phone, "11999998888");
  assert.ok(Array.isArray(pkg.timelineHistory));
});
