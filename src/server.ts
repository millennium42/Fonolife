import { buildApp } from './app.js';
import { config } from './config.js';
import { migrate } from './db/migrate.js';
import { seedDemo } from './db/seed.js';
import { pool } from './db/pool.js';

await migrate();
const userCount = await pool.query<{ c: number }>('SELECT count(*)::int c FROM users');
if (config.demo || userCount.rows[0].c === 0) {
  await seedDemo(true);
}
await buildApp().listen({ port: config.port, host: '0.0.0.0' });

