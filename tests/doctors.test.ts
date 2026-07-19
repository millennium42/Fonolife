import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("banco exige médico ativo em novos vínculos e preserva a associação financeira", async () => {
  const sql = await readFile(
    new URL("../migrations/006_doctors_services.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /role IN \('admin', 'operator', 'doctor'\)/);
  assert.match(sql, /role = 'doctor' AND active/);
  assert.match(sql, /sales_require_doctor/);
  assert.match(sql, /follow_up_tasks_require_doctor/);
  assert.match(sql, /financial_entries_require_doctor/);
  assert.match(sql, /original\.doctor_id IS NOT DISTINCT FROM NEW\.doctor_id/);
  assert.match(sql, /sales[\s\S]+doctor_id IS NOT DISTINCT FROM NEW\.doctor_id/);
  const fix = await readFile(
    new URL("../migrations/007_fix_doctor_trigger.sql", import.meta.url),
    "utf8",
  );
  assert.match(fix, /to_jsonb\(NEW\)->>'category'/);
  assert.doesNotMatch(fix, /NEW\.category/);
});

test("API limita médico aos próprios registros mínimos", async () => {
  const source = await readFile(
    new URL("../src/app.ts", import.meta.url),
    "utf8",
  );
  const start = source.indexOf('app.get(\n    "/api/doctor/records"');
  const end = source.indexOf("  app.get<{\n    Querystring", start);
  const route = source.slice(start, end);
  assert.ok(start > 0 && end > start);
  for (const field of [
    "s.id",
    "s.product",
    "s.sale_kind",
    "s.quantity",
    "s.total_amount_cents",
    "s.sold_on",
    "p.name patient_name",
    "f.description",
    "f.amount_cents",
    "f.occurred_on",
  ])
    assert.match(route, new RegExp(field.replace(".", "\\.")));
  assert.doesNotMatch(route, /phone|clinical|balance|notes/);
  assert.match(source, /role === "operator" && body\.entryType === "expense"/);
});

test("seed DEMO cria médicos e atualiza os dois caixas operacionais", async () => {
  const seed = await readFile(
    new URL("../src/db/seed.ts", import.meta.url),
    "utf8",
  );
  for (const value of [
    "dra.ana@demo.local",
    "dr.paulo@demo.local",
    "Venda de Aparelhos",
    "Serviços",
    "ON CONFLICT\\(cnpj\\) DO UPDATE",
  ])
    assert.match(seed, new RegExp(value));
});
