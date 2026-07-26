import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Acessibilidade e Layout Responsivo (WCAG 2.1 AA)', () => {
  test('deve passar na verificação axe no login e páginas autenticadas', async ({ page }) => {
    // 1. Tela de Login
    await page.goto('/');
    const loginAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(loginAxe.violations).toEqual([]);

    // Realizar login demonstrativo sem transportar senha para o cliente
    await page.getByRole('button', { name: /Entrar como Administrador/ }).click();
    await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible();

    // 2. Dashboard principal
    const dashboardAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(dashboardAxe.violations).toEqual([]);

    // 3. Sem overflow horizontal no viewport atual
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("modal prende foco, fecha com Escape e devolve foco ao gatilho", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Entrar como Administrador/ }).click();
    await page.getByRole("button", { name: "Financeiro" }).click();
    const trigger = page.getByRole("button", { name: "+ Novo Lançamento" });
    await trigger.focus();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Novo lançamento financeiro" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
