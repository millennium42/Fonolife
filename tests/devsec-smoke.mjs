import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = "http://localhost:3000";
const origin = base;
const health = await fetch(`${base}/api/health`);
assert.equal(health.headers.get("x-content-type-options"), "nosniff");
assert.match(
  health.headers.get("content-security-policy") ?? "",
  /frame-ancestors 'none'/,
);
assert.match(
  health.headers.get("strict-transport-security") ?? "",
  /max-age=31536000/,
);

const missingOrigin = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}",
});
assert.equal(missingOrigin.status, 403);
assert.match(
  missingOrigin.headers.get("content-type") ?? "",
  /application\/problem\+json/,
);
const wrongOrigin = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { origin: "https://evil.invalid", "content-type": "application/json" },
  body: "{}",
});
assert.equal(wrongOrigin.status, 403);

async function login(email, password) {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie()[0];
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Secure/i);
  return cookie.split(";")[0];
}
async function call(path, cookie, options = {}) {
  return fetch(`${base}${path}`, {
    ...options,
    headers: {
      origin,
      cookie,
      "content-type": "application/json",
      ...options.headers,
    },
  });
}

const operator = await login("operador@demo.local", "operador123");
for (const path of ["/api/admin/users", "/api/finance/summary"])
  assert.equal((await call(path, operator)).status, 403);
assert.equal(
  (
    await call("/api/company-accounts", operator, {
      method: "POST",
      body: "{}",
    })
  ).status,
  403,
);
assert.equal(
  (
    await call(`/api/patients?search=${encodeURIComponent("' OR 1=1 --")}`, operator)
  ).status,
  200,
);

const doctorsResponse = await call("/api/doctors", operator);
assert.equal(doctorsResponse.status, 200);
const doctors = (await doctorsResponse.json()).doctors;
assert.deepEqual(
  doctors.map((doctor) => doctor.name).sort(),
  ["Dr. Paulo", "Dra. Ana"],
);
const ana = doctors.find((doctor) => doctor.name === "Dra. Ana");
const paulo = doctors.find((doctor) => doctor.name === "Dr. Paulo");
const accounts = (await (await call("/api/company-accounts", operator)).json())
  .accounts;
const servicesAccount =
  accounts.find((account) => account.short_label === "Serviços") ?? accounts[0];

const patientResponse = await call("/api/patients", operator, {
  method: "POST",
  body: JSON.stringify({
    name: "Paciente DevSec Médico",
    phone: "11988887777",
    contactSource: "other",
  }),
});
assert.equal(patientResponse.status, 201);
const patientId = (await patientResponse.json()).id;

assert.equal(
  (
    await call("/api/follow-ups", operator, {
      method: "POST",
      body: JSON.stringify({
        patientId,
        title: "Retorno sem médico",
        dueOn: "2026-07-30",
      }),
    })
  ).status,
  400,
);
const expense = {
  clientRequestId: randomUUID(),
  entryType: "expense",
  category: "other_expense",
  description: "Retirada indevida",
  amountCents: 1000,
  competenceOn: "2026-07-19",
  occurredOn: "2026-07-19",
  paymentMethod: "pix",
  companyAccountId: servicesAccount.id,
};
assert.equal(
  (
    await call("/api/finance/entries", operator, {
      method: "POST",
      body: JSON.stringify(expense),
    })
  ).status,
  403,
);
const service = {
  ...expense,
  clientRequestId: randomUUID(),
  entryType: "income",
  category: "service",
  description: "Serviço DevSec",
  patientId,
};
assert.equal(
  (
    await call("/api/finance/entries", operator, {
      method: "POST",
      body: JSON.stringify(service),
    })
  ).status,
  400,
);
const serviceResponse = await call("/api/finance/entries", operator, {
  method: "POST",
  body: JSON.stringify({ ...service, doctorId: ana.id }),
});
assert.equal(serviceResponse.status, 201);
const serviceId = (await serviceResponse.json()).id;

const saleResponse = await call("/api/sales", operator, {
  method: "POST",
  body: JSON.stringify({
    clientRequestId: randomUUID(),
    patientId,
    doctorId: paulo.id,
    saleKind: "service",
    product: "Avaliação DevSec",
    quantity: 1,
    totalAmountCents: 5000,
    soldOn: "2026-07-19",
    companyAccountId: servicesAccount.id,
    installments: [
      {
        amountCents: 5000,
        paymentMethod: "pix",
        dueOn: "2026-07-19",
        receivedOn: "2026-07-19",
      },
    ],
  }),
});
assert.equal(saleResponse.status, 201);
const saleId = (await saleResponse.json()).id;

const anaCookie = await login("dra.ana@demo.local", "medico123");
const anaRecords = await (await call("/api/doctor/records", anaCookie)).json();
assert.ok(anaRecords.services.some((item) => item.id === serviceId));
assert.equal(anaRecords.sales.some((item) => item.id === saleId), false);

const pauloCookie = await login("dr.paulo@demo.local", "medico123");
assert.equal((await call("/", pauloCookie)).status, 200);
const pauloRecordsResponse = await call("/api/doctor/records", pauloCookie);
assert.equal(pauloRecordsResponse.status, 200);
const pauloRecords = await pauloRecordsResponse.json();
const ownSale = pauloRecords.sales.find((item) => item.id === saleId);
assert.deepEqual(Object.keys(ownSale).sort(), [
  "id",
  "patient_name",
  "product",
  "quantity",
  "sale_kind",
  "sold_on",
  "total_amount_cents",
]);
assert.deepEqual(
  Object.keys(pauloRecords.services.find((item) => item.description.includes("Avaliação DevSec"))).sort(),
  ["amount_cents", "description", "id", "occurred_on", "patient_name"],
);
assert.doesNotMatch(JSON.stringify(pauloRecords), /11988887777|notes|balance|clinical/i);
for (const path of [
  "/api/patients",
  "/api/finance/entries",
  "/api/company-accounts",
  "/api/doctors",
  `/api/sales/${saleId}`,
])
  assert.equal((await call(path, pauloCookie)).status, 403);

assert.equal(
  (
    await call("/api/auth/logout", operator, {
      method: "POST",
      body: "{}",
    })
  ).status,
  204,
);
assert.equal((await call("/api/auth/me", operator)).status, 401);

for (let index = 0; index < 5; index++)
  await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.9",
    },
    body: JSON.stringify({
      email: "nobody@invalid.local",
      password: "senha-invalida",
    }),
  });
const limited = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: {
    origin,
    "content-type": "application/json",
    "x-forwarded-for": "203.0.113.9",
  },
  body: JSON.stringify({
    email: "nobody@invalid.local",
    password: "senha-invalida",
  }),
});
assert.equal(limited.status, 429);
console.log(
  "devsec-smoke: headers, cookie, CSRF, RBAC, médicos, minimização LGPD e rate limit aprovados",
);
