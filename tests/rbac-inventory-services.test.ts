import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { hashToken } from "../src/domain/security.js";

test("Suíte de Matriz RBAC de Estoque, Catálogo e Serviços (PR-04)", async (t) => {
  const app = buildApp();
  const originalQuery = pool.query.bind(pool);
  const originalConnect = pool.connect.bind(pool);

  const auditLogs: Array<{ userId: string; action: string; entityType: string; details?: any }> = [];
  const insertedMovements: Array<{ id: string; productId: string; movementType: string; quantity: number }> = [];

  const handleQuery = async (sql: any, params?: any[]) => {
    const queryText = typeof sql === "string" ? sql : sql?.text || "";

    if (queryText.includes("FROM user_sessions")) {
      const hash = params?.[0];
      if (hash === hashToken("token-doctor")) {
        return {
          rows: [{ id: "usr-doctor", name: "Dr. Mock", email: "doc@fonolife.local", role: "doctor", must_change_password: false }],
          rowCount: 1,
        };
      }
      if (hash === hashToken("token-operator")) {
        return {
          rows: [{ id: "usr-operator", name: "Op Mock", email: "op@fonolife.local", role: "operator", must_change_password: false }],
          rowCount: 1,
        };
      }
      if (hash === hashToken("token-admin")) {
        return {
          rows: [{ id: "usr-admin", name: "Admin Mock", email: "admin@fonolife.local", role: "admin", must_change_password: false }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    }

    if (queryText.includes("INSERT INTO audit_events")) {
      auditLogs.push({
        userId: params?.[0],
        action: params?.[1],
        entityType: params?.[2],
        details: params?.[4],
      });
      return { rows: [], rowCount: 1 };
    }

    if (queryText.includes("INSERT INTO inventory_movements")) {
      insertedMovements.push({
        id: params?.[0],
        productId: params?.[1],
        movementType: params?.[2],
        quantity: params?.[3],
      });
      return { rows: [], rowCount: 1 };
    }

    if (queryText.includes("SELECT COALESCE(SUM(quantity),0) stock FROM inventory_movements")) {
      return { rows: [{ stock: "100" }], rowCount: 1 };
    }

    if (queryText.includes("FROM products") && queryText.includes("FOR UPDATE")) {
      return { rows: [{ id: params?.[0] || "prod-1" }], rowCount: 1 };
    }

    if (queryText.includes("SELECT cost_cents FROM products")) {
      return { rows: [{ cost_cents: "5000" }], rowCount: 1 };
    }

    if (queryText.includes("FROM inventory_movements WHERE client_request_id")) {
      return { rows: [], rowCount: 0 };
    }

    if (queryText.includes("UPDATE services SET")) {
      return { rows: [{ id: params?.[7] || "serv-1", version: 2 }], rowCount: 1 };
    }

    if (queryText.includes("INSERT INTO products") || queryText.includes("UPDATE products SET")) {
      return { rows: [{ id: "prod-1", version: 1 }], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  };

  pool.query = handleQuery as any;
  pool.connect = (async () => {
    return {
      query: handleQuery,
      release: () => {},
    };
  }) as any;

  const origin = "http://localhost:5173";
  const doctorHeaders = { cookie: "fonolife_session=token-doctor", origin, "content-type": "application/json" };
  const operatorHeaders = { cookie: "fonolife_session=token-operator", origin, "content-type": "application/json" };
  const adminHeaders = { cookie: "fonolife_session=token-admin", origin, "content-type": "application/json" };

  await t.test("Médico: proibido de ver histórico de estoque ou realizar mutações (deve retornar 403 e auditar)", async () => {
    auditLogs.length = 0;
    insertedMovements.length = 0;

    const resGetMovements = await app.inject({ method: "GET", url: "/api/inventory/movements", headers: doctorHeaders });
    assert.equal(resGetMovements.statusCode, 403, "Médico não deve poder listar histórico detalhado de estoque");
    assert.ok(auditLogs.some((e) => e.userId === "usr-doctor" && e.action === "rbac_access_denied"));

    const resPostMovement = await app.inject({
      method: "POST",
      url: "/api/inventory/movements",
      headers: doctorHeaders,
      payload: { productId: "11111111-1111-1111-1111-111111111111", movementType: "entry", quantity: 5, notes: "Ajuste por médico", clientRequestId: "req-doc-1" },
    });
    assert.equal(resPostMovement.statusCode, 403, "Médico não deve poder realizar movimentação no estoque");
    assert.equal(insertedMovements.length, 0, "Nenhuma alteração de estoque deve ocorrer no banco após 403");

    const resPostService = await app.inject({
      method: "POST",
      url: "/api/services",
      headers: doctorHeaders,
      payload: { name: "Serviço Não Autorizado", priceCents: 15000, cmvCents: 3000, executionTimeMinutes: 30 },
    });
    assert.equal(resPostService.statusCode, 403, "Médico não deve poder cadastrar serviços");

    const resPutService = await app.inject({
      method: "PUT",
      url: "/api/services/serv-1",
      headers: doctorHeaders,
      payload: { name: "Editado por Médico", priceCents: 15000 },
    });
    assert.equal(resPutService.statusCode, 403, "Médico não deve poder editar serviços");
  });

  await t.test("Tentativa de forjar sale_deduction em endpoints manuais (deve retornar 403 e sem alteração de saldo)", async () => {
    auditLogs.length = 0;
    insertedMovements.length = 0;

    const resOperatorForge = await app.inject({
      method: "POST",
      url: "/api/inventory/movements",
      headers: operatorHeaders,
      payload: { productId: "11111111-1111-1111-1111-111111111111", movementType: "sale_deduction", quantity: -1, notes: "Baixa manual forjada", clientRequestId: "req-forge-1" },
    });
    assert.equal(resOperatorForge.statusCode, 403, "Tentativa de forjar sale_deduction via API manual deve retornar 403");
    assert.equal(insertedMovements.length, 0, "Nenhuma alteração no saldo deve ocorrer após bloqueio de sale_deduction forjado");
    assert.ok(auditLogs.some((e) => e.userId === "usr-operator" && e.action === "forged_sale_deduction_denied"));

    const resAdminForge = await app.inject({
      method: "POST",
      url: "/api/admin/inventory/movements",
      headers: adminHeaders,
      payload: { productId: "11111111-1111-1111-1111-111111111111", movementType: "sale_deduction", quantity: -1, notes: "Baixa manual forjada por admin", clientRequestId: "req-forge-2" },
    });
    assert.equal(resAdminForge.statusCode, 403, "Admin também não pode forjar sale_deduction na rota manual");
    assert.equal(insertedMovements.length, 0);
  });

  await t.test("Operador: não pode criar ou editar produtos (exclusivo do Administrador)", async () => {
    const resPostProduct = await app.inject({
      method: "POST",
      url: "/api/admin/products",
      headers: operatorHeaders,
      payload: { name: "Produto Op", brand: "Marca", model: "Modelo", priceCents: 10000, costCents: 4000 },
    });
    assert.equal(resPostProduct.statusCode, 403, "Operador não deve poder criar produtos");

    const resPatchProduct = await app.inject({
      method: "PATCH",
      url: "/api/admin/products/prod-1",
      headers: operatorHeaders,
      payload: { priceCents: 12000 },
    });
    assert.equal(resPatchProduct.statusCode, 403, "Operador não deve poder editar products");
  });

  await t.test("Operações autorizadas conformes com a matriz RBAC", async () => {
    // Médico pode ler produtos e serviços para o atendimento
    const resGetProdDoc = await app.inject({ method: "GET", url: "/api/products", headers: doctorHeaders });
    assert.equal(resGetProdDoc.statusCode, 200);
    const resGetServDoc = await app.inject({ method: "GET", url: "/api/services", headers: doctorHeaders });
    assert.equal(resGetServDoc.statusCode, 200);

    // Operador pode ver histórico de estoque, ajustar estoque (entry/adjustment) e gerenciar serviços
    const resGetMovOp = await app.inject({ method: "GET", url: "/api/inventory/movements", headers: operatorHeaders });
    assert.equal(resGetMovOp.statusCode, 200);

    const resPostMovOp = await app.inject({
      method: "POST",
      url: "/api/inventory/movements",
      headers: operatorHeaders,
      payload: { productId: "11111111-1111-1111-1111-111111111111", movementType: "entry", quantity: 10, notes: "Entrada legítima", clientRequestId: "req-legit-1" },
    });
    assert.equal(resPostMovOp.statusCode, 201);

    const resPostServOp = await app.inject({
      method: "POST",
      url: "/api/services",
      headers: operatorHeaders,
      payload: { name: "Serviço Operador", priceCents: 20000, cmvCents: 5000, executionTimeMinutes: 40 },
    });
    assert.equal(resPostServOp.statusCode, 201);

    // Admin pode realizar tudo, incluindo criar e editar produtos
    const resPostProdAdmin = await app.inject({
      method: "POST",
      url: "/api/admin/products",
      headers: adminHeaders,
      payload: { name: "Aparelho Admin", brand: "Fonolife", model: "X99", priceCents: 450000, costCents: 180000 },
    });
    assert.equal(resPostProdAdmin.statusCode, 201);
  });

  t.after(() => {
    pool.query = originalQuery;
    pool.connect = originalConnect;
  });
});
