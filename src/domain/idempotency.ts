import { createHash } from "node:crypto";

export function idempotencyFingerprint(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
