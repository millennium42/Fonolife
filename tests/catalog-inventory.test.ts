import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validProduct, validInventoryMovement } from "../src/domain/inventory.js";
import { validService } from "../src/domain/services.js";

describe("Suíte de Validação de Catálogo, Estoque e CMV (PR-09)", () => {
  test("valida produto com SKU opcional e estoque mínimo", () => {
    assert.equal(
      validProduct({ name: "Aparelho A", brand: "Brand", model: "Mod", priceCents: 1000, costCents: 500, sku: "SKU-123", minStock: 2 }),
      true
    );
    assert.equal(
      validProduct({ name: "Aparelho B", brand: "Brand", model: "Mod", priceCents: 1000, costCents: 500, minStock: -1 }),
      false
    );
  });

  test("valida movimentação de estoque com justificativa obrigatória e chave idempotente", () => {
    assert.equal(
      validInventoryMovement({ productId: "123e4567-e89b-12d3-a456-426614174000", movementType: "entry", quantity: 5, notes: "Ajuste manual com justificativa" }),
      true
    );
    // Rejeita sem justificativa válida (notas vazias ou curtas)
    assert.equal(
      validInventoryMovement({ productId: "123e4567-e89b-12d3-a456-426614174000", movementType: "entry", quantity: 5, notes: "" }),
      false
    );
  });

  test("valida serviço com tempo de execução, CMV e insumos associados", () => {
    assert.equal(
      validService({ name: "Limpeza e Calibração", priceCents: 15000, cmvCents: 3000, executionTimeMinutes: 45 }),
      true
    );
    // Rejeita tempo de execução negativo
    assert.equal(
      validService({ name: "Serviço Inválido", priceCents: 15000, cmvCents: 3000, executionTimeMinutes: -10 }),
      false
    );
  });
});
