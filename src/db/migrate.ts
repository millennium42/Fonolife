import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pool } from './pool.js';

export async function migrate(directory = resolve(dirname(fileURLToPath(import.meta.url)), '../../migrations')) {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [740_042]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    for (const file of (await readdir(directory)).filter(x => x.endsWith('.sql')).sort()) {
      const sql = await readFile(resolve(directory, file), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const prior = await client.query<{checksum: string}>('SELECT checksum FROM schema_migrations WHERE version=$1', [file]);
      if (prior.rowCount) {
        if (prior.rows[0].checksum !== checksum) throw new Error(`Checksum divergente: ${file}`);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(version, checksum) VALUES ($1,$2)', [file, checksum]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally { await client.query('SELECT pg_advisory_unlock($1)', [740_042]); client.release(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) migrate().then(() => pool.end()).catch(error => { console.error(error); process.exitCode = 1; });
