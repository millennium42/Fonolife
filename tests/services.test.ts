import test from "node:test";
import assert from "node:assert/strict";
import { validService, validServiceName, validExecutionTime } from "../src/domain/services.js";
import { validProduct } from "../src/domain/inventory.js";

test("valida nome de serviço e tempo de execução", () => {
  assert.equal(validServiceName("Audiometria Tonal"), true);
  assert.equal(validServiceName("A"), false);
  assert.equal(validExecutionTime(45), true);
  assert.equal(validExecutionTime(-10), false);
  assert.equal(validExecutionTime(12.5), false);
});

test("valida cadastro completo de serviço com CMV e centavos inteiros", () => {
  const validServiceObj = {
    name: "Audiometria Tonal e Vocal",
    priceCents: 25000,
    cmvCents: 3500,
    executionTimeMinutes: 45,
  };
  assert.equal(validService(validServiceObj), true);

  const invalidCmv = { ...validServiceObj, cmvCents: -500 };
  assert.equal(validService(invalidCmv), false);

  const floatPrice = { ...validServiceObj, priceCents: 250.55 };
  assert.equal(validService(floatPrice), false);
});

test("valida produto com CMV (costCents)", () => {
  const validProd = {
    name: "Aparelho Fonolife X1",
    brand: "Fonolife",
    model: "X1",
    priceCents: 150000,
    costCents: 60000,
  };
  assert.equal(validProduct(validProd), true);

  const invalidCost = { ...validProd, costCents: -100 };
  assert.equal(validProduct(invalidCost), false);
});
