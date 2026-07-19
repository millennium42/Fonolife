import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('migração base mantém esquema e auditoria imutável', async()=>{const sql=await readFile(new URL('../migrations/001_base.sql',import.meta.url),'utf8');for(const table of ['users','user_sessions','company_accounts','audit_events'])assert.match(sql,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));assert.match(sql,/BEFORE UPDATE OR DELETE ON audit_events/);});
test('migrador usa lock, checksum e transação', async()=>{const source=await readFile(new URL('../src/db/migrate.ts',import.meta.url),'utf8');assert.match(source,/pg_advisory_lock/);assert.match(source,/sha256/);assert.match(source,/BEGIN/);assert.match(source,/schema_migrations/);});
