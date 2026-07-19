import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard mantém agregados financeiros exclusivos do Admin", async () => {
  const source = await readFile(new URL("../src/app.ts", import.meta.url), "utf8");
  const route = source.slice(source.indexOf('app.get("/api/dashboard"'), source.indexOf("const publicDir"));
  assert.match(route, /preHandler: authenticated/);
  assert.match(route, /request\.currentUser!\.role === "admin"/);
  assert.match(route, /response\.financial/);
  assert.match(route, /completed_at IS NULL AND t\.cancelled_at IS NULL/);
  assert.match(route, /America\/Sao_Paulo/);
});
