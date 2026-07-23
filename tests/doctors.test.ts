import test from "node:test";
import assert from "node:assert/strict";
import { buildCalendarDays, validLicenseNumber } from "../src/domain/doctors.js";

test("valida número de registro profissional CRFa / CRM", () => {
  assert.equal(validLicenseNumber("CRFa 2-19842"), true);
  assert.equal(validLicenseNumber("CRM/SP 123456"), true);
  assert.equal(validLicenseNumber(""), false);
  assert.equal(validLicenseNumber("12"), false);
});

test("gera grade de dias para a agenda calendário mensal", () => {
  const days = buildCalendarDays(2026, 7, "2026-07-22");
  assert.ok(days.length >= 35);
  const todayItem = days.find((d) => d.dateString === "2026-07-22");
  assert.ok(todayItem);
  assert.equal(todayItem.isToday, true);
  assert.equal(todayItem.isCurrentMonth, true);
});
