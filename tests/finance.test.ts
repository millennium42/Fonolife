import test from 'node:test';
import assert from 'node:assert/strict';
import { validFinancialEntry } from '../src/domain/finance.js';

test('aceita somente lançamento financeiro completo com centavos inteiros', () => {
  const entry = { entryType:'expense', category:'rent', description:'Aluguel', amountCents:250000, competenceOn:'2026-07-01', occurredOn:'2026-07-05', paymentMethod:'pix', companyAccountId:'11111111-1111-4111-8111-111111111111', clientRequestId:'22222222-2222-4222-8222-222222222222' };
  assert.equal(validFinancialEntry(entry), true);
  assert.equal(validFinancialEntry({ ...entry, amountCents: 1.5 }), false);
  assert.equal(validFinancialEntry({ ...entry, category: 'inventada' }), false);
});
