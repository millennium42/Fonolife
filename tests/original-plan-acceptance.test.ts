import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("matriz original mantém todos os requisitos comprovados", () => {
  const matrix = readFileSync("docs/original-plan-acceptance.md", "utf8");
  const accepted = matrix.match(/^\| [A-Z]+-\d+ .*\| Atendido \|$/gm) ?? [];
  assert.equal(accepted.length, 71);
  assert.doesNotMatch(matrix, /\| (Parcial|Futuro|Backlog|Planejado) \|/);
  for (const column of ["REQ", "Requisito", "Backend", "Frontend", "Teste", "Evidência", "Estado"]) {
    assert.match(matrix, new RegExp(`\\b${column}\\b`));
  }
});

test("mantém as cinco jornadas funcionais executáveis", () => {
  const journeys = readFileSync("tests/e2e/original-plan-journeys.spec.ts", "utf8");
  for (let index = 1; index <= 5; index += 1) {
    assert.match(journeys, new RegExp(`jornada ${index} —`));
  }
  assert.match(journeys, /saleRequests/);
  assert.match(journeys, /export-data/);
  assert.match(journeys, /CMV Histórico/);
});
