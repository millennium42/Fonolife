import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const primary = "http://localhost:3000";
const secondary = process.env.SECONDARY_ORIGIN;
assert.ok(secondary, "SECONDARY_ORIGIN é obrigatório");
const allowedOrigin = primary;

async function login(origin, role) {
  const response = await fetch(`${origin}/api/demo/session`, {
    method: "POST",
    headers: { origin: allowedOrigin, "content-type": "application/json" },
    body: JSON.stringify({ role }),
  });
  assert.equal(response.status, 200);
  return response.headers.getSetCookie()[0].split(";")[0];
}

async function call(origin, path, cookie, options = {}) {
  return fetch(`${origin}${path}`, {
    ...options,
    headers: {
      origin: allowedOrigin,
      cookie,
      "content-type": "application/json",
      ...options.headers,
    },
  });
}

for (const origin of [primary, secondary]) {
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
}

const sessions = await Promise.all(
  Array.from({ length: 12 }, (_, index) =>
    login(index % 2 ? primary : secondary, index % 3 ? "operator" : "admin"),
  ),
);
assert.equal(sessions.length, 12);
const [primaryOperator, secondaryOperator] = await Promise.all([
  login(primary, "operator"),
  login(secondary, "operator"),
]);

const products = await (await call(primary, "/api/products", primaryOperator)).json();
const accounts = await (await call(secondary, "/api/company-accounts", secondaryOperator)).json();
const product = products.products.find((item) => item.active);
assert.ok(product);
assert.ok(accounts.accounts[0]?.id);

const movementKey = randomUUID();
const movement = {
  clientRequestId: movementKey,
  productId: product.id,
  movementType: "entry",
  quantity: 1,
  notes: "Concorrência entre instâncias",
};
const movementResponses = await Promise.all([
  call(primary, "/api/inventory/movements", primaryOperator, {
    method: "POST",
    body: JSON.stringify(movement),
  }),
  call(secondary, "/api/inventory/movements", secondaryOperator, {
    method: "POST",
    body: JSON.stringify(movement),
  }),
]);
assert.deepEqual(movementResponses.map((response) => response.status).sort(), [200, 201]);
const movementBodies = await Promise.all(movementResponses.map((response) => response.json()));
assert.equal(movementBodies[0].id, movementBodies[1].id);
const movementConflict = await call(primary, "/api/inventory/movements", primaryOperator, {
  method: "POST",
  body: JSON.stringify({ ...movement, quantity: 2 }),
});
assert.equal(movementConflict.status, 409);

const saleKey = randomUUID();
const sale = {
  clientRequestId: saleKey,
  patientId: "50000000-0000-4000-8000-000000000001",
  productId: product.id,
  product: product.name,
  quantity: 1,
  totalAmountCents: Number(product.price_cents),
  soldOn: "2026-07-25",
  companyAccountId: accounts.accounts[0].id,
  notes: "Venda concorrente entre instâncias",
  deliveryStatus: "pending",
  installments: [{
    amountCents: Number(product.price_cents),
    dueOn: "2026-07-25",
    paymentMethod: "pix",
  }],
};
const saleResponses = await Promise.all([
  call(primary, "/api/sales", primaryOperator, {
    method: "POST",
    body: JSON.stringify(sale),
  }),
  call(secondary, "/api/sales", secondaryOperator, {
    method: "POST",
    body: JSON.stringify(sale),
  }),
]);
assert.deepEqual(saleResponses.map((response) => response.status).sort(), [200, 201]);
const saleBodies = await Promise.all(saleResponses.map((response) => response.json()));
assert.equal(saleBodies[0].id, saleBodies[1].id);
const saleConflict = await call(secondary, "/api/sales", secondaryOperator, {
  method: "POST",
  body: JSON.stringify({ ...sale, notes: "Payload diferente" }),
});
assert.equal(saleConflict.status, 409);

const saleDetails = await (
  await call(primary, `/api/sales/${saleBodies[0].id}`, primaryOperator)
).json();
const receivableId = saleDetails.installments[0].id;
const settleKey = randomUUID();
const settlement = {
  clientRequestId: settleKey,
  receivedOn: "2026-07-25",
};
const settleResponses = await Promise.all([
  call(primary, `/api/finance/receivables/${receivableId}/settle`, primaryOperator, {
    method: "POST",
    body: JSON.stringify(settlement),
  }),
  call(secondary, `/api/finance/receivables/${receivableId}/settle`, secondaryOperator, {
    method: "POST",
    body: JSON.stringify(settlement),
  }),
]);
assert.deepEqual(settleResponses.map((response) => response.status).sort(), [200, 201]);
const settleBodies = await Promise.all(settleResponses.map((response) => response.json()));
assert.equal(settleBodies[0].id, settleBodies[1].id);
const settleConflict = await call(primary, `/api/finance/receivables/${receivableId}/settle`, primaryOperator, {
  method: "POST",
  body: JSON.stringify({ ...settlement, receivedOn: "2026-07-26" }),
});
assert.equal(settleConflict.status, 409);

console.log("release-concurrency-smoke: duas instâncias, concorrência e payload divergente aprovados");
