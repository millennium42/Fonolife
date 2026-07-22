import test from "node:test";
import assert from "node:assert/strict";
import {
  validInventoryMovement,
  validProduct,
  validProductBrand,
  validProductModel,
  validProductName,
} from "../src/domain/inventory.js";

test("valida nome, marca e modelo de produtos", () => {
  assert.equal(validProductName("Aparelho Audibel Pro"), true);
  assert.equal(validProductName("A"), false);
  assert.equal(validProductBrand("Audibel"), true);
  assert.equal(validProductModel("X200"), true);
});

test("valida cadastro completo de produto com centavos inteiros", () => {
  const valid = {
    name: "Audibel Pure Charge&Go",
    brand: "Audibel",
    model: "7AX",
    priceCents: 450000,
  };
  assert.equal(validProduct(valid), true);

  const invalidPrice = { ...valid, priceCents: 4500.5 }; // Não é centavo inteiro
  assert.equal(validProduct(invalidPrice), false);

  const zeroPrice = { ...valid, priceCents: 0 };
  assert.equal(validProduct(zeroPrice), false);
});

test("valida regras de movimentação de estoque", () => {
  const validEntry = {
    productId: "11111111-1111-1111-1111-111111111111",
    movementType: "entry",
    quantity: 10,
  };
  assert.equal(validInventoryMovement(validEntry), true);

  const validSale = {
    productId: "11111111-1111-1111-1111-111111111111",
    movementType: "sale_deduction",
    quantity: -1,
  };
  assert.equal(validInventoryMovement(validSale), true);

  const invalidSalePositive = {
    productId: "11111111-1111-1111-1111-111111111111",
    movementType: "sale_deduction",
    quantity: 1, // Baixa por venda não pode ser positiva!
  };
  assert.equal(validInventoryMovement(invalidSalePositive), false);

  const zeroQuantity = {
    productId: "11111111-1111-1111-1111-111111111111",
    movementType: "entry",
    quantity: 0,
  };
  assert.equal(validInventoryMovement(zeroQuantity), false);
});
