import { config } from "../../config.js";
import { seedBootstrap } from "./bootstrap.js";
import { seedDemo } from "./demo.js";
import { seedDevelopment } from "./development.js";
import { seedTest } from "./test.js";

export async function runSeedForCurrentEnvironment() {
  switch (config.appEnv) {
    case "demo":
      return seedDemo();
    case "test":
      return seedTest();
    case "development":
      return seedDevelopment();
    case "production":
      return seedBootstrap();
  }
}
