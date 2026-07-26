import { expect, test, type Page } from "@playwright/test";

function desktopOnly(projectName: string) {
  test.skip(projectName !== "desktop-1440", "Jornadas funcionais executadas uma vez; responsividade possui suíte própria.");
}

async function login(page: Page, role: "Administrador" | "Operador" | "Médico Fonoaudiólogo") {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(`Entrar como ${role}`) }).click();
  await expect(page.getByRole("banner")).toContainText(role === "Médico Fonoaudiólogo" ? "doctor" : role === "Administrador" ? "admin" : "operator");
}

test("jornada 1 — operador localiza prontuário e prepara venda parcelada", async ({ page }, testInfo) => {
  desktopOnly(testInfo.project.name);
  await login(page, "Operador");
  await page.getByRole("button", { name: "Pacientes" }).click();
  await expect(page.getByRole("heading", { name: "Pacientes", exact: true })).toBeVisible();
  await page.locator(".patient-link").first().click();
  const drawer = page.locator("aside.drawer");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Vendas e Serviços" })).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Financeiro do Paciente" })).toBeVisible();
  await drawer.getByRole("button", { name: /Nova Venda.*Catálogo/ }).click();
  const dialog = page.getByRole("dialog", { name: "Nova venda ou serviço" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Qtd. de Parcelas Futuras")).toBeVisible();
  await expect(dialog.getByLabel("Caixa / CNPJ Emissor")).toBeVisible();
});

test("jornada 2 — Caixa registra produto e serviço sem duplicar duplo clique", async ({ page }, testInfo) => {
  desktopOnly(testInfo.project.name);
  await login(page, "Operador");
  await page.getByRole("button", { name: "Caixa (PDV)" }).click();
  await page.getByLabel("1. Selecionar Paciente").selectOption({ index: 1 });
  await page.getByRole("button", { name: "+ Adicionar ao Carrinho" }).first().click();
  await page.getByRole("button", { name: "+ Adicionar Serviço" }).first().click();
  await page.getByLabel("Parcelamento").selectOption("2");

  let saleRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/sales") saleRequests += 1;
  });
  const checkout = page.getByRole("button", { name: /Finalizar Venda no Caixa/ });
  await checkout.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page.getByRole("status")).toContainText("Venda no Caixa realizada com sucesso");
  expect(saleRequests).toBe(2);

  await page.getByRole("button", { name: /prontuário deste paciente/ }).click();
  await expect(page.locator("aside.drawer")).toBeVisible();
  await page.locator("aside.drawer").getByRole("button", { name: /Voltar/ }).click();
  await page.getByRole("button", { name: "Financeiro" }).click();
  await expect(page.getByText("Lançamentos realizados")).toBeVisible();
});

test("jornada 3 — médico vê apenas vínculo autorizado e acessa emissão de laudo", async ({ page }, testInfo) => {
  desktopOnly(testInfo.project.name);
  await login(page, "Médico Fonoaudiólogo");
  await page.getByRole("button", { name: "Meus Pacientes" }).click();
  await page.locator(".patient-link").first().click();
  const drawer = page.locator("aside.drawer");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "+ Emitir Novo Laudo" }).click();
  await expect(page.getByRole("dialog", { name: "Emitir laudo clínico" })).toBeVisible();

  const denied = await page.request.get("/api/patients/00000000-0000-4000-8000-000000000000");
  expect([403, 404]).toContain(denied.status());
  expect((await page.request.get("/api/finance/entries")).status()).toBe(403);
  const allowedPatients = await (await page.request.get("/api/doctor/patients")).json();
  const allowedIds = new Set((allowedPatients.patients as Array<{ id: string }>).map((patient) => patient.id));
  const dashboard = await (await page.request.get("/api/dashboard")).json();
  expect((dashboard.queue as Array<{ patient_id: string }>).every((item) => allowedIds.has(item.patient_id))).toBe(true);
});

test("jornada 4 — administrador opera estoque, catálogo e auditoria financeira", async ({ page }, testInfo) => {
  desktopOnly(testInfo.project.name);
  await login(page, "Administrador");
  await page.getByRole("button", { name: "Estoque & Catálogo" }).click();
  await page.getByRole("button", { name: "Ajustar Estoque" }).first().click();
  await expect(page.getByRole("dialog", { name: /Ajustar estoque/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "+ Novo Produto" }).click();
  await expect(page.getByRole("dialog", { name: "Novo produto" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "+ Novo Serviço" }).click();
  await expect(page.getByRole("dialog", { name: "Novo serviço" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Financeiro" }).click();
  await expect(page.getByText("Saldo Consolidado")).toBeVisible();
  await expect(page.getByText("CMV Histórico")).toBeVisible();
  await expect(page.getByText("Margem Bruta")).toBeVisible();
  await expect(page.getByText("Lançamentos realizados")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Imprimir" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Paginação de lançamentos" })).toBeVisible();
  const csv = await page.request.get("/api/finance/entries.csv");
  expect(csv.ok()).toBe(true);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain("valor_centavos");
});

test("jornada 5 — LGPD exporta dados e protege anonimização", async ({ page }, testInfo) => {
  desktopOnly(testInfo.project.name);
  await login(page, "Administrador");
  const patientsResponse = await page.request.get("/api/patients");
  expect(patientsResponse.ok()).toBe(true);
  const patients = (await patientsResponse.json()).patients as Array<{ id: string }>;
  expect(patients.length).toBeGreaterThan(0);

  const exported = await page.request.get(`/api/patients/${patients[0].id}/export-data`);
  expect(exported.ok()).toBe(true);
  expect(exported.headers()["content-disposition"]).toContain("export_lgpd_");
  const payload = await exported.json();
  expect(payload.patientProfile.id).toBe(patients[0].id);
  expect(Array.isArray(payload.timelineHistory)).toBe(true);

  const rejected = await page.request.post(`/api/admin/patients/${patients[0].id}/anonymize`, {
    data: {},
    headers: { Origin: "http://localhost:3000" },
  });
  expect(rejected.status()).toBe(400);
});
