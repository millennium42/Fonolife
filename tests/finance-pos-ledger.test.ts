import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validFinancialEntry } from "../src/domain/finance.js";
import { validCents } from "../src/domain/sales.js";

describe("Suíte de Validação de Financeiro, Ledger e PDV (PR-10)", () => {
  test("valida centavos inteiros e rejeita valores zerados ou negativos", () => {
    assert.equal(validCents(1000), true);
    assert.equal(validCents(0), false);
    assert.equal(validCents(-500), false);
    assert.equal(validCents(10.5), false);
  });

  test("valida lançamento financeiro com conta jurídica e descrição válidas", () => {
    assert.equal(
      validFinancialEntry({
        entryType: "income",
        category: "consultation",
        description: "Consulta Fonoaudiológica",
        amountCents: 25000,
        competenceOn: "2026-07-24",
        occurredOn: "2026-07-24",
        paymentMethod: "pix",
        companyAccountId: "123e4567-e89b-12d3-a456-426614174000",
      }),
      true
    );
    // Rejeita sem conta jurídica vinculada
    assert.equal(
      validFinancialEntry({
        entryType: "income",
        category: "consultation",
        description: "Consulta Fonoaudiológica",
        amountCents: 25000,
        competenceOn: "2026-07-24",
        occurredOn: "2026-07-24",
        paymentMethod: "pix",
        companyAccountId: "",
      }),
      false
    );
  });

  test("mantém snapshot de CMV e calcula margem sem consultar custo atual", () => {
    const migration = readFileSync("migrations/021_sale_cost_snapshot.sql", "utf8");
    const routes = readFileSync("src/modules/finance/routes.ts", "utf8");
    assert.match(migration, /cost_amount_cents/);
    assert.match(routes, /costAmountCents/);
    assert.match(routes, /margin_cents/);
    assert.match(routes, /FOR UPDATE OF p/);
    assert.match(routes, /Estoque insuficiente para os insumos do serviço/);
    assert.doesNotMatch(routes, /sum\(p\.cost_cents\)/);
  });
});
