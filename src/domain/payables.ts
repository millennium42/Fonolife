import { PAYMENT_METHODS, validCents } from "./sales.js";

export const PAYABLE_STATUSES = ["open", "partially_settled", "settled", "cancelled"] as const;

export function validPayableDraft(value: {
  vendorName?: string;
  companyAccountId?: string;
  description?: string;
  category?: string;
  amountCents?: number;
  competenceOn?: string;
  dueOn?: string;
  paymentMethod?: string;
  clientRequestId?: string;
}) {
  const date = /^\d{4}-\d{2}-\d{2}$/;
  return Boolean(value.vendorName?.trim() && value.vendorName.trim().length >= 2)
    && /^[0-9a-f-]{36}$/i.test(value.companyAccountId ?? "")
    && Boolean(value.description?.trim() && value.description.trim().length >= 2)
    && Boolean(value.category?.trim())
    && validCents(value.amountCents)
    && date.test(value.competenceOn ?? "")
    && date.test(value.dueOn ?? "")
    && PAYMENT_METHODS.includes(value.paymentMethod as never)
    && /^[0-9a-f-]{36}$/i.test(value.clientRequestId ?? "");
}
