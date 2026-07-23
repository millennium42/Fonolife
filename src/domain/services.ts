import { validNonNegativeCents } from "./inventory.js";

export type ServiceProductInput = {
  productId: string;
  quantity: number;
};

export type ServiceInput = {
  name: string;
  description?: string;
  priceCents: number;
  cmvCents: number;
  executionTimeMinutes: number;
  products?: ServiceProductInput[];
};

export type ServiceItem = ServiceInput & {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  products: (ServiceProductInput & { productName: string; unitPriceCents: number })[];
};

export function validServiceName(name?: string): boolean {
  return Boolean(name && name.trim().length >= 2);
}

export function validExecutionTime(minutes?: number): boolean {
  return typeof minutes === "number" && Number.isInteger(minutes) && minutes >= 0;
}

export function validService(service: {
  name?: string;
  priceCents?: number;
  cmvCents?: number;
  executionTimeMinutes?: number;
}): boolean {
  return (
    validServiceName(service.name) &&
    validNonNegativeCents(service.priceCents) &&
    validNonNegativeCents(service.cmvCents) &&
    validExecutionTime(service.executionTimeMinutes)
  );
}
