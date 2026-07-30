import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('migration 025_clinical_commercial_core tem restrições corretas e idempotência', async () => {
  const sql = await readFile(new URL('../migrations/025_clinical_commercial_core.sql', import.meta.url), 'utf8');

  // Idempotence checks
  assert.match(sql, /IF NOT EXISTS/);

  // Constraints required by prompt
  assert.match(sql, /status text NOT NULL DEFAULT 'scheduled' CHECK \(status IN \('scheduled','confirmed','checked_in','in_progress','completed','cancelled','no_show'\)\)/);
  
  // Required fields and constraints
  assert.match(sql, /patient_id uuid REFERENCES patients\(id\)/);
  assert.match(sql, /doctor_id uuid NOT NULL REFERENCES users\(id\)/);
  assert.match(sql, /scheduled_start timestamptz NOT NULL/);
  
  // Required indexes
  assert.match(sql, /appointments_doctor_time_idx/);
  assert.match(sql, /appointments_patient_time_idx/);
});
