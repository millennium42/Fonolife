import test from "node:test";
import assert from "node:assert/strict";
import { generateMonthGrid, getSaoPauloDateString } from "../web/src/features/calendar/calendar.js";

test("Calendar Utilities", async (t) => {
  await t.test("generateMonthGrid generates exactly 42 days", () => {
    const grid = generateMonthGrid(2026, 8);
    assert.equal(grid.length, 42);
  });

  await t.test("handles leap years correctly", () => {
    // Feb 2024 is a leap year. 29 days.
    const grid = generateMonthGrid(2024, 2);
    assert.equal(grid.length, 42);
    // Find Feb 29
    const feb29 = grid.find(d => d.month === 2 && d.day === 29);
    assert.ok(feb29);
    assert.equal(feb29?.isCurrentMonth, true);

    // Feb 2023 is not leap year
    const grid2023 = generateMonthGrid(2023, 2);
    const feb29_2023 = grid2023.find(d => d.month === 2 && d.day === 29);
    assert.equal(feb29_2023, undefined);
  });

  await t.test("handles months with 30 and 31 days", () => {
    // April has 30 days
    const april = generateMonthGrid(2026, 4);
    assert.equal(april.length, 42);
    const april30 = april.find(d => d.month === 4 && d.day === 30);
    const april31 = april.find(d => d.month === 4 && d.day === 31);
    assert.ok(april30);
    assert.equal(april30?.isCurrentMonth, true);
    assert.equal(april31, undefined);

    // July has 31 days
    const july = generateMonthGrid(2026, 7);
    const july31 = july.find(d => d.month === 7 && d.day === 31);
    assert.ok(july31);
    assert.equal(july31?.isCurrentMonth, true);
  });

  await t.test("handles month transition edges (Dec to Jan)", () => {
    const grid = generateMonthGrid(2025, 1); // January 2025
    assert.equal(grid[0].year, 2024);
    assert.equal(grid[0].month, 12);

    const gridDec = generateMonthGrid(2025, 12); // December 2025
    assert.equal(gridDec[gridDec.length - 1].year, 2026);
    assert.equal(gridDec[gridDec.length - 1].month, 1);
  });

  await t.test("gets correct date string in Sao Paulo timezone", () => {
    // 2026-08-15T01:00:00Z -> Sao Paulo (-3) -> 2026-08-14 22:00:00
    const spDate = getSaoPauloDateString("2026-08-15T01:00:00Z");
    assert.equal(spDate, "2026-08-14");
    
    // 2026-08-15T10:00:00Z -> Sao Paulo (-3) -> 2026-08-15 07:00:00
    const spDate2 = getSaoPauloDateString("2026-08-15T10:00:00Z");
    assert.equal(spDate2, "2026-08-15");
  });
});
