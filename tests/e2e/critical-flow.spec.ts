import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('E-mail').fill('admin@fonolife.com.br');
  await page.getByLabel('Senha').fill('admin123');
  await page.getByRole('button', { name: 'Entrar no Sistema', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible();
}

async function accessible(page: Page) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test('login, cadastro, venda, financeiro e layout responsivo', async ({ page }, testInfo) => {
  page.on('pageerror', error => console.error('pageerror:', error.message));
  await login(page);
  await accessible(page);

  await page.getByRole('button', { name: 'Pacientes' }).click();
  await page.getByRole('button', { name: '+ Novo paciente' }).click();
  const patientName = `Paciente QA ${Date.now()}`;
  await page.getByLabel('Nome completo').fill(patientName);
  await page.getByLabel('Telefone / Celular').fill(`119${String(Date.now()).slice(-8)}`);
  await page.getByRole('button', { name: 'Salvar Prontuário' }).click();
  await expect(page.getByRole('heading', { name: patientName })).toBeVisible();
  await page.getByRole('button', { name: 'Nova Venda / Serviço (Catálogo)' }).click();
  await expect(page.getByRole('heading', { name: 'Nova Venda / Lançamento de Serviço no Prontuário' })).toBeVisible();

  await page.getByLabel('Descrição do Item Comercializado').fill('Aparelho QA');
  await page.getByLabel('Valor Total Negociado (R$)').fill('1000,00');
  await page.getByLabel('Caixa / CNPJ Emissor').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Concluir e Emitir Venda' }).click();
  await expect(page.getByRole('status')).toContainText('Venda/Serviço registrado');
  await accessible(page);

  await page.getByRole('button', { name: 'Financeiro' }).click();
  await expect(page.getByText('Lançamentos realizados')).toBeVisible();
  await page.getByRole('button', { name: '+ Novo Lançamento' }).click();
  await expect(page.getByRole('heading', { name: 'Lançamento no Fluxo de Caixa' })).toBeVisible();
  await accessible(page);
  await page.screenshot({ path: testInfo.outputPath('financeiro.png'), fullPage: true });
});
