import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";

describe("Congelamento de Contratos HTTP da API", () => {
  test("deve instanciar app e registrar todas as rotas conhecidas", async () => {
    const app = buildApp();
    await app.ready();

    // Inspeciona todas as rotas registradas na árvore do Fastify
    const routes: string[] = [];
    app.printRoutes({ commonPrefix: false });
    
    // Verifica endpoints críticos do sistema
    const expectedEndpoints = [
      "GET /api/health",
      "GET /api/config",
      "POST /api/auth/login",
      "POST /api/auth/logout",
      "GET /api/auth/me",
      "POST /api/auth/change-password",
      "GET /api/admin/users",
      "POST /api/admin/users",
      "PATCH /api/admin/users/:id",
      "GET /api/products",
      "POST /api/admin/products",
      "PATCH /api/admin/products/:id",
      "GET /api/inventory/movements",
      "POST /api/inventory/movements",
      "POST /api/admin/inventory/movements",
      "GET /api/services",
      "POST /api/services",
      "PUT /api/services/:id",
      "GET /api/doctors",
      "GET /api/patients",
      "POST /api/patients",
      "GET /api/patients/:id",
      "PATCH /api/patients/:id",
      "POST /api/patients/:id/archive",
      "POST /api/patients/:id/events",
      "POST /api/patients/:id/whatsapp-click",
      "GET /api/patients/:id/attachments",
      "POST /api/patients/:id/attachments",
      "GET /api/attachments/:id/download",
      "POST /api/attachments/:id/archive",
      "POST /api/admin/reconcile-attachments",
      "GET /api/patients/:id/export-data",
      "POST /api/admin/patients/:id/anonymize",
      "GET /api/patients/:id/timeline",
      "GET /api/follow-ups",
      "POST /api/follow-ups",
      "POST /api/follow-ups/:id/complete",
      "POST /api/follow-ups/:id/cancel",
      "GET /api/company-accounts",
      "POST /api/company-accounts",
      "POST /api/sales",
      "GET /api/sales/:id",
      "PATCH /api/sales/:id/delivery",
      "POST /api/sales/:id/cancel",
      "GET /api/finance/entries",
      "POST /api/finance/entries",
      "GET /api/finance/receivables",
      "POST /api/finance/receivables/:id/settle",
      "POST /api/finance/entries/:id/reverse",
      "GET /api/finance/summary",
      "GET /api/dashboard",
      "GET /api/doctor/schedule",
      "GET /api/doctor/patients",
      "POST /api/doctor/consultations",
    ];

    for (const ep of expectedEndpoints) {
      const [method, url] = ep.split(" ");
      const response = await app.inject({
        method: method as any,
        url,
      });
      // Nenhuma rota deve retornar 404 Not Found (rotas sem auth retornam 401 ou 403, provando que o endpoint existe e está registrado)
      assert.notEqual(
        response.statusCode,
        404,
        `Rota ${ep} não foi encontrada na aplicação Fastify.`
      );
    }
  });
});
