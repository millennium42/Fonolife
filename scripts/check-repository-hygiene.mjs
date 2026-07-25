import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function git(...args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }
  return result.stdout;
}

const tracked = git("ls-files", "-z").split("\0").filter(Boolean);
const failures = [];
const forbiddenPaths = [
  /^\.graphify\//,
  /^graphify-out\//,
  /^\.agents\//,
  /^\.m1nd\//,
  /^checkpoint-store\//,
  /^\.codex\/hooks\.json$/,
  /(?:^|\/)(?:test-results|playwright-report)\//,
  /^(?:antibodies|auto_ingest_state|boot_config_v1|boot_kv_migration_journal_v1|boot_kv_migration_v1|boot_memory_state|calibration_state|checkpoint-working-set-v1|daemon_alerts|daemon_state|document_artifact_inventory|document_cache_index|graph_snapshot|ingest_roots|plasticity_state|temporal_state_v1|tremor_state|trust_state)\.json$/,
];

for (const path of tracked) {
  if (forbiddenPaths.some((pattern) => pattern.test(path))) {
    failures.push(`${path}: artefato local não pode ser versionado`);
    continue;
  }

  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    continue;
  }

  const checks = [
    [/[A-Za-z]:[\\/](?:Users|Documents)[\\/][^\s"'`]+/i, "caminho absoluto do Windows"],
    [/\/(?:home|Users)\/(?!usuario(?:\/|$)|user(?:\/|$)|nome(?:\/|$))[^\s"'`]+/, "caminho pessoal Unix"],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "chave privada"],
    [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/, "token GitHub"],
    [/\bAKIA[0-9A-Z]{16}\b/, "access key AWS"],
  ];
  for (const [pattern, label] of checks) {
    if (pattern.test(content)) failures.push(`${path}: ${label}`);
  }
}

const runtimeFiles = {
  "package.json": /"node"\s*:\s*">=24 <25"/,
  "package-lock.json": /"node"\s*:\s*">=24 <25"/,
  Dockerfile: /^FROM node:24-alpine/m,
  ".github/workflows/ci.yml": /node-version:\s*24/,
  ".nvmrc": /^24\s*$/,
  ".node-version": /^24\s*$/,
  "render.yaml": /key:\s*NODE_VERSION[\s\S]*?value:\s*"24"/,
};

for (const [path, pattern] of Object.entries(runtimeFiles)) {
  const content = readFileSync(path, "utf8");
  if (!pattern.test(content)) failures.push(`${path}: runtime deve usar Node 24`);
}

if (failures.length) {
  console.error("Repository hygiene failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Repository hygiene passed (${tracked.length} tracked files, Node 24 aligned).`);
