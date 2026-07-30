export const CRM_ACCOUNT_TYPES = ["company", "insurer", "partner", "referrer", "other"] as const;
export const CRM_ACTIVITY_TYPES = ["note", "task", "follow_up", "call", "meeting"] as const;
export const CRM_ENTITY_TYPES = ["account", "contact", "opportunity", "patient", "appointment"] as const;
export const CRM_OPPORTUNITY_PRIORITIES = ["low", "medium", "high"] as const;
export const CRM_OPPORTUNITY_STATUSES = ["open", "won", "lost", "archived"] as const;

const uuid = /^[0-9a-f-]{36}$/i;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export const validUuid = (value: unknown) => typeof value === "string" && uuid.test(value);
export const validIsoDate = (value: unknown) => typeof value === "string" && isoDate.test(value);
export const validIsoDateTime = (value: unknown) => typeof value === "string" && isoDateTime.test(value);
export const validName = (value: unknown, min = 2) => typeof value === "string" && value.trim().length >= min;
export const validCustomFields = (value: unknown) =>
  value === undefined || (typeof value === "object" && value !== null && !Array.isArray(value));
export const integerCents = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
export const integerPercent = (value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100;

export function validAccountType(value: unknown): value is (typeof CRM_ACCOUNT_TYPES)[number] {
  return typeof value === "string" && CRM_ACCOUNT_TYPES.includes(value as never);
}

export function validOpportunityPriority(value: unknown): value is (typeof CRM_OPPORTUNITY_PRIORITIES)[number] {
  return typeof value === "string" && CRM_OPPORTUNITY_PRIORITIES.includes(value as never);
}

export function validOpportunityStatus(value: unknown): value is (typeof CRM_OPPORTUNITY_STATUSES)[number] {
  return typeof value === "string" && CRM_OPPORTUNITY_STATUSES.includes(value as never);
}

export function validActivityType(value: unknown): value is (typeof CRM_ACTIVITY_TYPES)[number] {
  return typeof value === "string" && CRM_ACTIVITY_TYPES.includes(value as never);
}

export function validEntityType(value: unknown): value is (typeof CRM_ENTITY_TYPES)[number] {
  return typeof value === "string" && CRM_ENTITY_TYPES.includes(value as never);
}
