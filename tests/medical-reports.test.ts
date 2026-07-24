import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { validMedicalReport } from "../src/domain/reports.js";

describe("Suíte de Validação de Laudos Médicos e Fonoaudiológicos (PR-12)", () => {
  test("valida laudo com campos obrigatórios e registro profissional (CRM/CRFa)", () => {
    assert.equal(
      validMedicalReport({
        title: "Laudo Audiométrico e Avaliação Auditiva",
        diagnosis: "Perda auditiva neurossensorial de grau moderado bilateral",
        audiometricFindings: "Limiares tonais alterados nas frequências altas de 2kHz a 8kHz",
        recommendation: "Indicação de prótese auditiva digital e reabilitação",
        conclusion: "Apto para adaptação de aparelho auditivo",
        professionalLicense: "CRFa 10234-SP",
      }),
      true
    );
  });

  test("rejeita laudo sem registro CRM/CRFa ou sem título", () => {
    assert.equal(
      validMedicalReport({
        title: "",
        diagnosis: "Perda auditiva",
        recommendation: "Aparelho auditivo",
        professionalLicense: "CRFa 10234-SP",
      }),
      false
    );

    assert.equal(
      validMedicalReport({
        title: "Laudo Audiométrico",
        diagnosis: "Perda auditiva",
        recommendation: "Aparelho auditivo",
        professionalLicense: "",
      }),
      false
    );
  });
});
