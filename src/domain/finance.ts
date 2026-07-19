import { PAYMENT_METHODS, validCents } from './sales.js';

export const ENTRY_TYPES = ['income', 'expense'] as const;
export const FINANCE_CATEGORIES = ['hearing_aid_sale','service','maintenance','other_income','supplier','rent','payroll','tax','utilities','marketing','other_expense'] as const;

export function validFinancialEntry(value: { entryType?: string; category?: string; description?: string; amountCents?: number; competenceOn?: string; occurredOn?: string; paymentMethod?: string; companyAccountId?: string; clientRequestId?: string }) {
  const date = /^\d{4}-\d{2}-\d{2}$/;
  return ENTRY_TYPES.includes(value.entryType as never)
    && FINANCE_CATEGORIES.includes(value.category as never)
    && Boolean(value.description?.trim() && value.description.trim().length >= 2)
    && validCents(value.amountCents)
    && date.test(value.competenceOn ?? '')
    && date.test(value.occurredOn ?? '')
    && PAYMENT_METHODS.includes(value.paymentMethod as never)
    && /^[0-9a-f-]{36}$/i.test(value.companyAccountId ?? '')
    && /^[0-9a-f-]{36}$/i.test(value.clientRequestId ?? '');
}

