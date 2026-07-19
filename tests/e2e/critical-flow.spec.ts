import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('E-mail').fill('admin@demo.local');
  await page.getByLabel('Senha').fill('admin123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible();
}

async function accessible(page: Page) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test('login, cadastro, venda, financeiro e layout responsivo', async ({ page }, testInfo) => {
  page.on('pageerror', error => console.error('pageerror:', error.message));
  const patientName = `Paciente QA <img src=x onerror=window.__fonolifeXss=1> ${Date.now()}`;
  await login(page);
  await accessible(page);

  await page.getByRole('button', { name: 'Pacientes' }).click();
  await page.getByRole('button', { name: '+ Novo paciente' }).click();
  await page.getByLabel('Nome completo').fill(patientName);
  await page.getByLabel('Telefone ou WhatsApp').fill(`119${String(Date.now()).slice(-8)}`);
  await page.getByRole('button', { name: 'Salvar paciente' }).click();
  await expect(page.getByRole('heading', { name: patientName })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, '__fonolifeXss'))).toBeUndefined();
  await page.getByRole('button', { name: /Registrar venda ou serviço/ }).click();
  await expect(page.getByRole('heading', { name: 'Registrar venda' })).toBeVisible();

  await page.getByLabel('Médico responsável').selectOption({ index: 1 });
  await page.getByLabel('Aparelho ou serviço').fill('Aparelho QA');
  await page.getByLabel('Valor total (R$)').fill('1000,00');
  await page.getByLabel('Vai para qual caixa/CNPJ?').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Confirmar venda' }).click();
  await expect(page.getByRole('status')).toContainText('Venda ou serviço registrado');
  await accessible(page);

  await page.getByRole('button', { name: 'Financeiro' }).click();
  await expect(page.getByText('Lançamentos realizados')).toBeVisible();
  await page.getByRole('button', { name: '+ Novo lançamento' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await accessible(page);
  await page.screenshot({ path: testInfo.outputPath('financeiro.png'), fullPage: true });
});

test('médico vê somente sua área associada mesmo após atualizar', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('E-mail').fill('dra.ana@demo.local');
  await page.getByLabel('Senha').fill('medico123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Meus atendimentos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vendas associadas a você' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pacientes' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Financeiro' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Meus atendimentos' })).toBeVisible();
  await accessible(page);
});
