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

    // Realizar login
    await page.getByLabel('E-mail').fill('admin@demo.local');
    await page.getByLabel('Senha').fill('admin123');
    await page.getByRole('button', { name: 'Entrar' }).click();
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
});
