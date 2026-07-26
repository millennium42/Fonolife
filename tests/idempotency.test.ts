import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { idempotencyFingerprint } from "../src/domain/idempotency.js";

test("fingerprint de idempotência é estável e distingue payloads", () => {
  const payload = { amountCents: 1000, description: "Receita" };
  assert.equal(idempotencyFingerprint(payload), idempotencyFingerprint({ ...payload }));
  assert.notEqual(
    idempotencyFingerprint(payload),
    idempotencyFingerprint({ ...payload, amountCents: 1001 }),
  );
  assert.match(idempotencyFingerprint(payload), /^[0-9a-f]{64}$/);
});

test("migração registra fingerprints nos três ledgers idempotentes", async () => {
  const migration = await readFile(
    new URL("../migrations/022_idempotency_fingerprints.sql", import.meta.url),
    "utf8",
  );
  for (const table of ["sales", "financial_entries", "inventory_movements"]) {
    assert.match(migration, new RegExp(`ALTER TABLE ${table}`));
  }
});
