import { validCents } from "./sales.js";
import { isOneOf } from "./patients.js";

export const MOVEMENT_TYPES = ["entry", "sale_deduction", "adjustment"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type Product = {
  id: string;
  name: string;
  brand: string;
  model: string;
  priceCents: number;
  costCents: number;
  active: boolean;
};

export type InventoryMovement = {
  id: string;
  productId: string;
  movementType: MovementType;
  quantity: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
};

export function validProductName(name?: string): boolean {
  return Boolean(name && name.trim().length >= 2);
}

export function validProductBrand(brand?: string): boolean {
  return Boolean(brand && brand.trim().length >= 2);
}

export function validProductModel(model?: string): boolean {
  return Boolean(model && model.trim().length >= 1);
}

export function validNonNegativeCents(cents?: number): boolean {
  return typeof cents === "number" && Number.isInteger(cents) && cents >= 0;
}

export function validProduct(product: {
  name?: string;
  brand?: string;
  model?: string;
  priceCents?: number;
  costCents?: number;
}): boolean {
  return (
    validProductName(product.name) &&
    validProductBrand(product.brand) &&
    validProductModel(product.model) &&
    validCents(product.priceCents) &&
    (product.costCents === undefined || validNonNegativeCents(product.costCents))
  );
}

export function validInventoryMovement(movement: {
  productId?: string;
  movementType?: string;
  quantity?: number;
}): boolean {
  if (!movement.productId || !/^[0-9a-f-]{36}$/i.test(movement.productId)) return false;
  if (!isOneOf(movement.movementType, MOVEMENT_TYPES)) return false;
  if (typeof movement.quantity !== "number" || !Number.isInteger(movement.quantity) || movement.quantity === 0) return false;
  if (movement.movementType === "sale_deduction" && movement.quantity > 0) return false;
  return true;
}
