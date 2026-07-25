import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { migrate } from "../db/migrate.js";
import { seedDemo } from "../db/seeds/demo.js";

function validateResetBoundary() {
  if (config.appEnv !== "demo") {
    throw new Error("Demo reset is available only when APP_ENV=demo.");
  }
  if (process.env.DEMO_RESET_CONFIRM !== "RESET_DEMO") {
    throw new Error("Set DEMO_RESET_CONFIRM=RESET_DEMO to confirm destructive reset.");
  }
  const expectedToken = process.env.DEMO_OPERATION_TOKEN;
  if (!expectedToken || process.env.DEMO_RESET_TOKEN !== expectedToken) {
    throw new Error("A valid demo operation token is required.");
  }

  const database = new URL(config.databaseUrl);
  const databaseName = database.pathname.slice(1);
  const expectedDatabase = process.env.DEMO_DATABASE_NAME;
  const expectedHost = process.env.DEMO_DATABASE_HOST;
  if (!expectedHost || database.hostname !== expectedHost) {
    throw new Error("Demo reset refused: database host is not the isolated demo host.");
  }
  if (!expectedDatabase || databaseName !== expectedDatabase || !databaseName.endsWith("_demo")) {
    throw new Error("Demo reset refused: database name is not the isolated demo database.");
  }
}

async function resetDemo() {
  validateResetBoundary();
  console.info(`[demo-reset] started ${new Date().toISOString()}`);
  await pool.query("DROP SCHEMA public CASCADE");
  await pool.query("CREATE SCHEMA public");
  await migrate();
  await seedDemo();
  console.info(`[demo-reset] completed ${new Date().toISOString()}`);
}

resetDemo()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "Demo reset failed.");
    await pool.end();
    process.exitCode = 1;
  });
