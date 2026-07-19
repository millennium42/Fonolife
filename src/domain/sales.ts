export const PAYMENT_METHODS = ['cash','pix','debit_card','credit_card','bank_transfer','boleto','other'] as const;
export const DELIVERY_STATUSES = ['pending','delivered','adaptation','completed'] as const;

export type SaleInstallment = { amountCents: number; paymentMethod: string; dueOn: string; receivedOn?: string };

export function validCents(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export function validateInstallments(totalAmountCents: number, installments: SaleInstallment[]) {
  return validCents(totalAmountCents)
    && installments.length > 0
    && installments.every(item => validCents(item.amountCents) && PAYMENT_METHODS.includes(item.paymentMethod as never) && /^\d{4}-\d{2}-\d{2}$/.test(item.dueOn) && (!item.receivedOn || /^\d{4}-\d{2}-\d{2}$/.test(item.receivedOn)))
    && installments.reduce((sum, item) => sum + item.amountCents, 0) === totalAmountCents;
}

export function splitMonthly(totalAmountCents: number, count: number, firstDueOn: string) {
  if (!validCents(totalAmountCents) || !Number.isInteger(count) || count < 1 || count > 120 || !/^\d{4}-\d{2}-\d{2}$/.test(firstDueOn)) throw new Error('Parcelamento inválido');
  const [year, month, day] = firstDueOn.split('-').map(Number);
  const base = Math.floor(totalAmountCents / count);
  return Array.from({ length: count }, (_, index) => {
    const targetMonth = month - 1 + index;
    const y = year + Math.floor(targetMonth / 12);
    const m = targetMonth % 12;
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return { amountCents: index === count - 1 ? totalAmountCents - base * (count - 1) : base, dueOn: `${y}-${String(m + 1).padStart(2,'0')}-${String(Math.min(day,lastDay)).padStart(2,'0')}` };
  });
}
