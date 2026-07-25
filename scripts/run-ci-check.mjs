import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const mode = process.argv.includes("--full") ? "--full" : "--quick";
const candidates = process.platform === "win32"
  ? [
      `${process.env.ProgramFiles}\\Git\\bin\\bash.exe`,
      `${process.env.ProgramFiles}\\Git\\usr\\bin\\bash.exe`,
      "bash",
    ]
  : ["bash"];

const bash = candidates.find((candidate) => candidate === "bash" || existsSync(candidate));
if (!bash) {
  console.error("Bash não encontrado. Instale Git for Windows ou execute no Linux.");
  process.exit(1);
}

const result = spawnSync(bash, ["scripts/ci-check.sh", mode], { stdio: "inherit" });
process.exit(result.status ?? 1);
