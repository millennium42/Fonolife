import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildApp } from "../src/app.ts";
import {
  validAccountType,
  validActivityType,
  validOpportunityPriority,
  validOpportunityStatus,
} from "../src/domain/crm.ts";
import {
  canTransitionAppointment,
  validAppointmentWindow,
  validBookingMode,
} from "../src/domain/appointments.ts";
import { validPayableDraft } from "../src/domain/payables.ts";

describe("entrega clinico-comercial local", () => {
  test("mantem invariantes de dominio do CRM, agenda e contas a pagar", () => {
    assert.equal(validAccountType("insurer"), true);
    assert.equal(validAccountType("microservice"), false);
    assert.equal(validOpportunityPriority("high"), true);
    assert.equal(validOpportunityPriority("urgent"), false);
    assert.equal(validOpportunityStatus("won"), true);
    assert.equal(validOpportunityStatus("draft"), false);
    assert.equal(validActivityType("follow_up"), true);
    assert.equal(validActivityType("email"), false);

    assert.equal(validBookingMode("walk_in"), true);
    assert.equal(validBookingMode("async"), false);
    assert.equal(validAppointmentWindow("2026-08-01T09:00", "2026-08-01T10:00"), true);
    assert.equal(validAppointmentWindow("2026-08-01T10:00", "2026-08-01T09:00"), false);
    assert.equal(canTransitionAppointment("scheduled", "confirmed"), true);
    assert.equal(canTransitionAppointment("completed", "scheduled"), false);

    assert.equal(validPayableDraft({
      vendorName: "Fornecedor Demo",
      companyAccountId: "11111111-1111-4111-8111-111111111111",
      description: "Boleto de aluguel",
      category: "rent",
      amountCents: 125000,
      competenceOn: "2026-08-01",
      dueOn: "2026-08-05",
      paymentMethod: "pix",
      clientRequestId: "22222222-2222-4222-8222-222222222222",
    }), true);
    assert.equal(validPayableDraft({
      vendorName: "A",
      companyAccountId: "invalid",
      description: "",
      category: "",
      amountCents: -1,
      competenceOn: "2026/08/01",
      dueOn: "2026/08/05",
      paymentMethod: "cashback",
      clientRequestId: "invalid",
    }), false);
  });

  test("registra contratos HTTP dos novos modulos clinico-comerciais", async () => {
    const app = buildApp();
    await app.ready();

    const headers = { origin: "http://localhost:5173", "content-type": "application/json" };
    const resourceId = "11111111-1111-4111-8111-111111111111";
    const pipelineId = "22222222-2222-4222-8222-222222222222";
    const stageId = "33333333-3333-4333-8333-333333333333";

    const expectedEndpoints = [
      ["GET", "/api/crm/accounts"],
      ["POST", "/api/crm/accounts"],
      ["PATCH", `/api/crm/accounts/${resourceId}`],
      ["GET", "/api/crm/contacts"],
      ["POST", "/api/crm/contacts"],
      ["PATCH", `/api/crm/contacts/${resourceId}`],
      ["GET", "/api/crm/pipelines"],
      ["POST", "/api/crm/pipelines"],
      ["POST", `/api/crm/pipelines/${pipelineId}/stages`],
      ["PATCH", `/api/crm/pipelines/${pipelineId}/stages/${stageId}`],
      ["GET", "/api/crm/opportunities"],
      ["POST", "/api/crm/opportunities"],
      ["PATCH", `/api/crm/opportunities/${resourceId}`],
      ["POST", `/api/crm/opportunities/${resourceId}/move`],
      ["GET", "/api/crm/activities"],
      ["POST", "/api/crm/activities"],
      ["PATCH", `/api/crm/activities/${resourceId}`],
      ["GET", "/api/crm/opportunities.csv"],
      ["GET", "/api/appointments"],
      ["POST", "/api/appointments"],
      ["PATCH", `/api/appointments/${resourceId}`],
      ["GET", "/api/finance/payables"],
      ["POST", "/api/finance/payables"],
      ["POST", `/api/finance/payables/${resourceId}/settle`],
      ["POST", `/api/finance/payables/${resourceId}/reverse`],
      ["GET", "/api/finance/payables.csv"],
      ["GET", "/api/finance/appointment-costing"],
    ] as const;

    for (const [method, url] of expectedEndpoints) {
      const response = await app.inject({
        method,
        url,
        headers,
        payload: method === "GET" ? undefined : {},
      });
      assert.notEqual(response.statusCode, 404, `Rota ${method} ${url} nao registrada.`);
    }

    await app.close();
  });

  test("protege regressos de baixa de contas a pagar", () => {
    const financeRoutes = readFileSync("src/modules/finance/routes.ts", "utf8");
    assert.match(financeRoutes, /SELECT \* FROM accounts_payable WHERE id=\$1 FOR UPDATE/);
    assert.doesNotMatch(financeRoutes, /FOR UPDATE`[\s\S]*sum\(f\.amount_cents\)/);
  });
});
