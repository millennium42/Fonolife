import { pool } from "./pool.js";
import { runSeedForCurrentEnvironment } from "./seeds/index.js";

export { runSeedForCurrentEnvironment };

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  runSeedForCurrentEnvironment()
    .then(() => pool.end())
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Seed failed.");
      process.exitCode = 1;
    });
}
