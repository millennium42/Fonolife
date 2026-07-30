import { test, expect } from '@playwright/test';

test.describe('Validação de Encoding e Mojibake (UTF-8)', () => {
  const mojibakeRegex = /(\ufffd|Ã|Â|â€|ðŸ)/;
  
  // Exceções onde "Ã" é válido e natural do idioma, ou "Â"
  const allowedPatterns = [
    /NÃO/g,
    /DEMONSTRAÇÃO/g,
    /AÇÕES/g,
    /PADRÃO/g,
    /CARTÃO/g,
    /SÃO/g,
    /MANUTENÇÃO/g,
    /ÂMBITO/g,
    /ÂNGULO/g,
  ];

  async function checkPageForMojibake(page: any, stepName: string) {
    await page.waitForLoadState('networkidle');
    let innerText = await page.evaluate(() => document.body.innerText);

    for (const pattern of allowedPatterns) {
      innerText = innerText.replace(pattern, '');
    }

    if (mojibakeRegex.test(innerText)) {
      const match = innerText.match(mojibakeRegex);
      await page.screenshot({ path: `tests/e2e/screenshots/mojibake-error-${stepName}.png` });
      throw new Error(`Encontrado padrão de mojibake "${match?.[0]}" na etapa "${stepName}". Screenshot salvo.`);
    }
    
    // As an additional check, we can just assert that it doesn't match
    expect(mojibakeRegex.test(innerText)).toBeFalsy();
  }

  test('Administrador não deve ver caracteres corrompidos nas páginas principais', async ({ page }) => {
    // Login como Administrador (assumindo que a demo permite clique rápido)
    await page.goto('/');
    
    // Login Demo
    await page.getByRole('button', { name: /Administrador/i }).click();
    
    // Verifica Início
    await checkPageForMojibake(page, 'admin-inicio');

    // Navegar Pacientes
    await page.getByRole('link', { name: /Pacientes/i }).click();
    await checkPageForMojibake(page, 'admin-pacientes');

    // Navegar Agenda
    await page.getByRole('link', { name: /Agenda/i }).click();
    await checkPageForMojibake(page, 'admin-agenda');

    // Navegar Financeiro
    await page.getByRole('link', { name: /Financeiro/i }).click();
    await checkPageForMojibake(page, 'admin-financeiro');

    // Navegar Estoque
    await page.getByRole('link', { name: /Catálogo/i }).click();
    await checkPageForMojibake(page, 'admin-estoque');
  });

  test('Médico não deve ver caracteres corrompidos nas páginas principais', async ({ page }) => {
    // Login como Médico
    await page.goto('/');
    
    await page.getByRole('button', { name: /Médico/i }).click();
    
    // Verifica Início
    await checkPageForMojibake(page, 'medico-inicio');

    // Navegar Agenda
    await page.getByRole('link', { name: /Agenda/i }).click();
    await checkPageForMojibake(page, 'medico-agenda');

    // Navegar Pacientes
    await page.getByRole('link', { name: /Pacientes/i }).click();
    await checkPageForMojibake(page, 'medico-pacientes');
  });
});
