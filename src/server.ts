import { buildApp } from './app.js';
import { config } from './config.js';
import { migrate } from './db/migrate.js';
import { seedDemo } from './db/seed.js';
await migrate();
if (config.demo) await seedDemo();
await buildApp().listen({ port: config.port, host: '0.0.0.0' });
