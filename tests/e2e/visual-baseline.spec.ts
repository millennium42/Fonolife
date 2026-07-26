import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.setFixedTime(new Date("2026-07-25T12:00:00-03:00"));
});

test("baseline visual de login, dashboard e financeiro", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("login.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.08,
  });

  await page.getByRole("button", { name: /Entrar como Administrador/ }).click();
  await expect(page.getByRole("heading", { name: "Início" })).toBeVisible();
  await expect(page).toHaveScreenshot("dashboard.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.08,
  });

  await page.getByRole("button", { name: "Financeiro" }).click();
  await page.getByRole("button", { name: "+ Novo Lançamento" }).click();
  await expect(page.getByRole("dialog", { name: "Novo lançamento financeiro" })).toBeVisible();
  await expect(page).toHaveScreenshot("financeiro-modal.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.08,
  });
});
