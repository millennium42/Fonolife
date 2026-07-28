import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { hashToken } from "../src/domain/security.js";

test("PROMPT 05 — Reproduzir falha de optimistic lock em PATCH de produtos e ausência de validação de domínio", async (t) => {
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

  const handleQuery = async (sql: any, params?: any[]) => {
    const text = typeof sql === "string" ? sql : sql?.text || "";

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
        return { rows: [prod], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (text.includes("UPDATE products SET")) {
      // Avalia o placeholder usado no SQL para ID e versão
      const idMatch = text.match(/id\s*=\s*\$(\d+)/);
      const idVal = idMatch && params ? params[Number(idMatch[1]) - 1] : undefined;
      
      const verMatch = text.match(/version\s*=\s*\$(\d+)/);
      const verVal = verMatch && params ? params[Number(verMatch[1]) - 1] : undefined;

      const product = idVal ? mockProducts[idVal] : undefined;
      if (!product || (verVal !== undefined && product.version !== verVal)) {
        return { rows: [], rowCount: 0 };
      }

      product.version += 1;
      return { rows: [{ id: product.id, version: product.version }], rowCount: 1 };
    }

    if (text.includes("INSERT INTO audit_events")) {
      auditLogs.push({ userId: params?.[0], action: params?.[1], entityType: params?.[2], entityId: params?.[3] });
      return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  };

  pool.query = handleQuery as any;
  pool.connect = async () => ({
    query: handleQuery,
    release: () => {},
  }) as any;

  try {
    await t.test("1. Atualização com version (sem active, versão correta) deve retornar 200 mas falha devido ao erro no índice do placeholder", async () => {
      mockProducts["prod-1"].version = 1;
      const res = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers: {
          origin: "http://localhost:5173",
          cookie: "fonolife_session=token-admin",
          "content-type": "application/json",
        },
        payload: {
          version: 1,
          name: "Nome Atualizado Sem Active",
        },
      });

      assert.equal(res.statusCode, 200, `Deveria atualizar com sucesso com version=1 sem active, mas retornou status ${res.statusCode}: ${res.body}`);
      const body = res.json();
      assert.equal(body.version, 2);
    });

    await t.test("2. Atualização com version (com active=true, versão correta) deve retornar 200 mas falha na comparação com booleano", async () => {
      mockProducts["prod-1"].version = 2;
      const res = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers: {
          origin: "http://localhost:5173",
          cookie: "fonolife_session=token-admin",
          "content-type": "application/json",
        },
        payload: {
          version: 2,
          active: true,
          name: "Nome Atualizado Com Active",
        },
      });

      assert.equal(res.statusCode, 200, `Deveria atualizar com sucesso com version=2 e active=true, mas retornou status ${res.statusCode}: ${res.body}`);
      const body = res.json();
      assert.equal(body.version, 3);
    });

    await t.test("3. Validação de domínio em PATCH: preço negativo, centavos fracionários ou estoque mínimo negativo devem falhar com 400 antes de tentar UPDATE", async () => {
      const resPrice = await app.inject({
        method: "PATCH",
        url: "/api/admin/products/prod-1",
        headers: {
          origin: "http://localhost:5173",
          cookie: "fonolife_session=token-admin",
          "content-type": "application/json",
        },
        payload: {
          version: mockProducts["prod-1"].version,
          priceCents: -100,
        },
      });
      assert.equal(resPrice.statusCode, 400, `Deveria rejeitar preço negativo com status 400 mas retornou ${resPrice.statusCode}`);
    });
  } finally {
    pool.query = originalQuery;
    pool.connect = originalConnect;
    await app.close();
  }
});
