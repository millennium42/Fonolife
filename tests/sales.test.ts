import test from 'node:test';
import assert from 'node:assert/strict';
import { splitMonthly, validateInstallments } from '../src/domain/sales.js';

test('valida soma exata e centavos inteiros',()=>{
  assert.equal(validateInstallments(100000,[{amountCents:20000,paymentMethod:'pix',dueOn:'2026-07-18',receivedOn:'2026-07-18'},{amountCents:40000,paymentMethod:'credit_card',dueOn:'2026-08-18'},{amountCents:40000,paymentMethod:'credit_card',dueOn:'2026-09-18'}]),true);
  assert.equal(validateInstallments(100000,[{amountCents:99999,paymentMethod:'pix',dueOn:'2026-07-18'}]),false);
});

test('divide centavos e ajusta dia inexistente',()=>{
  assert.deepEqual(splitMonthly(10000,3,'2026-01-31'),[{amountCents:3333,dueOn:'2026-01-31'},{amountCents:3333,dueOn:'2026-02-28'},{amountCents:3334,dueOn:'2026-03-31'}]);
});
