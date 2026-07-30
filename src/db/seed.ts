import { pool } from "./pool.js";
import { runSeedForCurrentEnvironment } from "./seeds/index.js";

export { runSeedForCurrentEnvironment };

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js") || process.argv[1]?.includes("seed.ts")) {
  console.log("Starting seed...");
  runSeedForCurrentEnvironment()
    .then(() => pool.end())
    .catch((error) => {
      console.error("SEED ERROR:", error);
      process.exitCode = 1;
    });
}
