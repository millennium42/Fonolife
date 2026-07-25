import { buildApp } from './app.js';
import { config } from './config.js';
import { migrate } from './db/migrate.js';
import { runSeedForCurrentEnvironment } from './db/seed.js';
import { pool } from './db/pool.js';

await migrate();
if (config.demo) {
  await runSeedForCurrentEnvironment();
}
await buildApp().listen({ port: config.port, host: '0.0.0.0' });


