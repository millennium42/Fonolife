import test from 'node:test';
import assert from 'node:assert/strict';
import { FOLLOW_UP_FILTERS, saoPauloDate } from '../src/domain/follow-ups.js';

test('calcula a data civil em São Paulo', () => {
  assert.equal(saoPauloDate(new Date('2026-07-19T02:30:00Z')), '2026-07-18');
  assert.deepEqual(FOLLOW_UP_FILTERS, ['today','overdue','upcoming','adaptation','no-contact']);
});
