import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { hashToken } from "../src/domain/security.js";

test("PROMPT 05 — Verificação completa de optimistic lock, regras de domínio, concorrência e auditoria atômica de produtos", async (t) => {
  const app = buildApp();
  const originalQuery = pool.query.bind(pool);
  const originalConnect = pool.connect.bind(pool);

  let mockProducts: Record<string, any> = {
    "prod-1": {
      id: "prod-1",
      name: "Aparelho Auditivo Original",
      brand: "Fonolife Brand",
      model: "Modelo X",
      sku: "FONO-MODX-01",
      price_cents: 150000,
      cost_cents: 80000,
      min_stock: 3,
      active: true,
      version: 1,
    },
  };

  const auditLogs: Array<any> = [];
  let txInFlight = 0;
  let auditRecordedInsideTx = false;

  const handleQuery = async (sql: any, params?: any[]) => {
    const text = typeof sql === "string" ? sql : sql?.text || "";

    if (text === "BEGIN") {
      txInFlight++;
      return { rows: [], rowCount: 0 };
    }
    if (text === "COMMIT") {
      txInFlight--;
      return { rows: [], rowCount: 0 };
    }
    if (text === "ROLLBACK") {
      if (txInFlight > 0) txInFlight--;
      return { rows: [], rowCount: 0 };
    }

    if (text.includes("FROM user_sessions")) {
      const hash = params?.[0];
      if (hash === hashToken("token-admin")) {
        return {
          rows: [{ id: "usr-admin", name: "Admin Mock", email: "admin@fonolife.local", role: "admin", must_change_password: false }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    }

    if (text.includes("SELECT 1 FROM products WHERE id=$1") || (text.includes("SELECT") && text.includes("FROM products") && text.includes("WHERE id="))) {
      const idVal = params?.[0];
      const prod = mockProducts[idVal];
      if (prod) {
        return { rows: [{ ...prod }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (text.includes("UPDATE products SET")) {
      const idVal = params?.[8]; // $9 na query estática
      const verVal = params?.[9]; // $10 na query estática

      const product = idVal ? mockProducts[idVal] : undefined;
      if (!product || (verVal !== undefined && product.version !== verVal)) {
        return { rows: [], rowCount: 0 };
      }

      product.name = params?.[0];
      product.brand = params?.[1];
      product.model = params?.[2];
      product.sku = params?.[3];
      product.price_cents = params?.[4];
      product.cost_cents = params?.[5];
      product.min_stock = params?.[6];
      product.active = params?.[7];
      product.version += 1;
      return { rows: [{ id: product.id, version: product.version }], rowCount: 1 };
    }

    if (text.includes("INSERT INTO audit_events")) {
      if (txInFlight > 0 && params?.[2] === "product") {
        auditRecordedInsideTx = true;
      }
      auditLogs.push({ userId: params?.[0], action: params?.[1], entityType: params?.[2], entityId: params?.[3], details: params?.[4] });
      return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  };

  pool.query = handleQuery as any;
  pool.connect = async () => ({
    query: handleQuery,
    release: () => {},
  }) as any;

  const headers = {
    origin: "http://localhost:5173",
    cookie: "fonolife_session=token-admin",
    "content-type": "application/json",
  };

  try {
    await t.test("1. Atualização com version sem active (preservação de campo ausente) deve ter sucesso sem erro 409", async () => {
      mockProducts["prod-1"].version = 1;
      const res = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers,
        payload: {
          version: 1,
          name: "Nome Atualizado Sem Active",
        },
      });

      assert.equal(res.statusCode, 200, `Retornou status ${res.statusCode}: ${res.body}`);
      assert.equal(res.json().version, 2);
      assert.equal(mockProducts["prod-1"].name, "Nome Atualizado Sem Active");
      assert.equal(mockProducts["prod-1"].active, true); // PRESERVA o anterior
    });

    await t.test("2. Atualização com active=true (sem falha na comparação booleana do placeholder)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers,
        payload: {
          version: 2,
          active: false,
        },
      });

      assert.equal(res.statusCode, 200, `Retornou status ${res.statusCode}: ${res.body}`);
      assert.equal(res.json().version, 3);
      assert.equal(mockProducts["prod-1"].active, false);
    });

    await t.test("3. Validação de domínio em PATCH: preço negativo ou nulo em campos obrigatórios retornam 400 antes de UPDATE", async () => {
      const resPrice = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers,
        payload: { version: 3, priceCents: -100 },
      });
      assert.equal(resPrice.statusCode, 400);

      const resNameNull = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers,
        payload: { version: 3, name: "" },
      });
      assert.equal(resNameNull.statusCode, 400);
      assert.equal(mockProducts["prod-1"].version, 3); // Não alterou versão nem aplicou no banco
    });

    await t.test("4. Limpeza explícita de SKU com null deve limpar o campo", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers,
        payload: { version: 3, sku: null },
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().version, 4);
      assert.equal(mockProducts["prod-1"].sku, null);
    });

    await t.test("5. Mutação sem o parâmetro version deve ser rejeitada com 400", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers,
        payload: { name: "Tentativa sem version" },
      });
      assert.equal(res.statusCode, 400);
      assert.ok(res.json().title.includes("Versão é obrigatória"));
    });

    await t.test("6. Simulação de concorrência: dois acessos simultâneos com mesma versão inicial falham com 409 no segundo", async () => {
      const initialVersion = mockProducts["prod-1"].version; // atualmente é 4

      // Primeiro usuário submete alteração usando a versão 4
      const res1 = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers,
        payload: { version: initialVersion, name: "Alteração Concorrente A" },
      });
      assert.equal(res1.statusCode, 200);
      assert.equal(res1.json().version, 5);

      // Segundo usuário (ou segunda aba) submete usando a mesma versão inicial 4
      const res2 = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers,
        payload: { version: initialVersion, name: "Alteração Concorrente B" },
      });
      assert.equal(res2.statusCode, 409);
      assert.ok(res2.json().title.includes("alterado por outro usuário"));
      assert.equal(mockProducts["prod-1"].version, 5); // Versão incrementou apenas uma única vez
      assert.equal(mockProducts["prod-1"].name, "Alteração Concorrente A"); // O segundo UPDATE não sobrescreveu!
    });

    await t.test("7. Diferenciar 404 (inexistente) de 409 (obsoleto) sem perder autorização", async () => {
      const res404 = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-inexistente",
        headers,
        payload: { version: 1, name: "Inexistente" },
      });
      assert.equal(res404.statusCode, 404);
      assert.ok(res404.json().title.includes("não encontrado"));
    });

    await t.test("8. Auditoria gravada atomicamente na transação", async () => {
      assert.equal(auditRecordedInsideTx, true, "Auditoria do produto deve ter sido gravada usando o mesmo PoolClient dentro de BEGIN/COMMIT");
    });
  } finally {
    pool.query = originalQuery;
    pool.connect = originalConnect;
    await app.close();
  }
});
