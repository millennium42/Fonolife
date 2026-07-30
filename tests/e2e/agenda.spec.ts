import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function accessible(page: Page) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test.describe('Agenda e Área Clínica', () => {
  test('jornada clínica e permissões de agenda', async ({ page }) => {
    // 1. Entrar como Doctor e confirmar que Início está ativo
    await page.goto('/');
    await page.getByRole('button', { name: /Médico Fonoaudiólogo/ }).click();
    await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible();

    // Doctor menu: "Início", "Agenda", "Pacientes"
    await expect(page.getByRole('button', { name: 'Agenda' })).toBeVisible();

    // 2. Navegar para a Agenda e ver calendário
    await page.getByRole('button', { name: 'Agenda' }).click();
    await expect(page.getByRole('heading', { name: 'Agenda Mensal' })).toBeVisible();
    
    // Validar acessibilidade na página inicial da Agenda
    await accessible(page);

    // 3. Navegar para mês seguinte e voltar para Hoje
    const navButtons = page.getByRole('navigation', { name: 'Navegação do calendário' });
    await navButtons.getByRole('button', { name: 'Próximo mês' }).click();
    await navButtons.getByRole('button', { name: 'Ir para hoje' }).click();

    // 4. Mudar para perfil Admin/Operator e criar agendamento
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('button', { name: /Administrador/ }).click();
    await page.getByRole('button', { name: 'Agenda' }).click();

    // Selecionar profissional no select de admin
    const doctorSelect = page.getByRole('combobox', { name: 'Filtrar por profissional' });
    await expect(doctorSelect).toBeVisible();
    await doctorSelect.selectOption({ index: 1 }); // Seleciona o primeiro da lista
    const selectedDoctorId = await doctorSelect.inputValue();

    // Criar agendamento
    await page.getByRole('button', { name: '+ Novo Agendamento' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Agendamento' })).toBeVisible();

    // Preencher Modal
    await page.getByLabel('Paciente (ID ou Nome)').fill('11999999999'); // Assumindo uma seed
    await page.getByLabel('Profissional').selectOption({ value: selectedDoctorId });
    // Usar data futura para garantir
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const dateStr = futureDate.toISOString().slice(0, 10);
    await page.getByLabel('Data e Hora').fill(`${dateStr}T14:00`);
    await page.getByLabel('Duração (minutos)').fill('30');
    await page.getByLabel('Tipo de Atendimento').fill('Retorno de E2E');
    await page.getByRole('button', { name: 'Salvar Agendamento' }).click();
    
    // Aguardar fechamento
    await expect(page.getByRole('heading', { name: 'Novo Agendamento' })).not.toBeVisible();

    // 5. Voltar como Doctor e confirmar visibilidade
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('button', { name: /Médico Fonoaudiólogo/ }).click();
    await page.getByRole('button', { name: 'Agenda' }).click();

    // Deve ser possível ver no painel "Lista do Dia" clicando no dia correspondente
    const dayButton = page.getByRole('button', { name: `Adicionar agendamento para ${dateStr}` });
    if (await dayButton.isVisible()) {
      await dayButton.click();
      await expect(page.getByText('Retorno de E2E')).toBeVisible();
      
      // Abrir prontuário pelo agendamento
      await page.getByRole('button', { name: /Paciente QA|Paciente/ }).first().click();
      await expect(page.getByRole('heading', { name: 'Prontuário do Paciente' })).toBeVisible();
    }
  });

  test('layout responsivo 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: /Médico Fonoaudiólogo/ }).click();
    await page.getByRole('button', { name: 'Agenda' }).click();
    await expect(page.getByRole('heading', { name: 'Agenda Mensal' })).toBeVisible();
    await accessible(page);
  });
});
