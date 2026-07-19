import assert from "node:assert/strict";

const origin = "http://localhost:3000";
async function login(email, password) {
  const response = await fetch(`${origin}/api/auth/login`, { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  assert.equal(response.status, 200);
  return response.headers.getSetCookie()[0].split(";")[0];
}
async function dashboard(cookie) {
  const response = await fetch(`${origin}/api/dashboard`, { headers: { cookie } });
  assert.equal(response.status, 200);
  return response.json();
}

const operator = await dashboard(await login("operador@demo.local", "operador123"));
assert.equal("financial" in operator, false);
for (const field of ["overdue", "today", "open_tasks", "adaptation", "month_sales"]) assert.equal(typeof operator[field], "number");
assert.ok(Array.isArray(operator.queue));

const admin = await dashboard(await login("admin@demo.local", "admin123"));
assert.equal(typeof admin.financial.consolidated.balance_cents, "number");
assert.ok(Array.isArray(admin.financial.byAccount));
console.log("dashboard-smoke: consultas e segregação Admin/Operador aprovadas");
