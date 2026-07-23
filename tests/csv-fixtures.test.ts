import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateVersionedCsvHash,
  isValidCivilDate,
  isValidUuid,
  parseCsv,
  validateFinancialCsvRow,
  validatePatientCsvRow,
} from "../src/domain/csv-import.js";

test("Suíte de Fixtures RFC 4180 e Casos Limite de Importação CSV (PR-04)", async (t) => {
  await t.test("Suporta campos multilinha entre aspas no CSV", () => {
    const csvContent = `nome,telefone,observacoes\n"Maria Silva",11999998888,"Observacao com\nquebra de linha\ne multiplos paragrafos"`;
    const parsed = parseCsv(csvContent);
    assert.equal(parsed.rows.length, 1);
    assert.equal(parsed.rows[0].nome, "Maria Silva");
    assert.equal(parsed.rows[0].observacoes, "Observacao com\nquebra de linha\ne multiplos paragrafos");
  });

  await t.test("Suporta delimitadores (vírgula/ponto-e-vírgula) dentro de campos entre aspas", () => {
    const csvContent = `nome,telefone,observacoes\n"Silva, João",11988887777,"Endereço: Rua A; Bairro B, São Paulo"`;
    const parsed = parseCsv(csvContent);
    assert.equal(parsed.rows.length, 1);
    assert.equal(parsed.rows[0].nome, "Silva, João");
    assert.equal(parsed.rows[0].observacoes, "Endereço: Rua A; Bairro B, São Paulo");
  });

  await t.test("Suporta aspas duplas escapadas em campos", () => {
    const csvContent = `nome,telefone,observacoes\n"Carlos ""Clinico"" Santos",11977776666,"Nota ""Urgente"""`;
    const parsed = parseCsv(csvContent);
    assert.equal(parsed.rows.length, 1);
    assert.equal(parsed.rows[0].nome, 'Carlos "Clinico" Santos');
    assert.equal(parsed.rows[0].observacoes, 'Nota "Urgente"');
  });

  await t.test("Rejeita aspas não balanceadas / malformatadas com erro explícito", () => {
    const csvContent = `nome,telefone\n"Maria Silva,11999998888`;
    assert.throws(
      () => parseCsv(csvContent),
      /Aspas não balanceadas ou malformatadas/
    );
  });

  await t.test("Rejeita cabeçalhos duplicados no CSV", () => {
    const csvContent = `nome,telefone,nome\nMaria,11999998888,Santos`;
    assert.throws(
      () => parseCsv(csvContent),
      /Cabeçalhos duplicados não permitidos no CSV: 'nome'/
    );
  });

  await t.test("Rejeita linhas com colunas extras em relação ao cabeçalho", () => {
    const csvContent = `nome,telefone\nMaria,11999998888,ExtraColumnValue`;
    assert.throws(
      () => parseCsv(csvContent),
      /Linha 2: Número de colunas \(3\) diverge do cabeçalho \(2\)/
    );
  });

  await t.test("Rejeita linhas com colunas faltantes em relação ao cabeçalho", () => {
    const csvContent = `nome,telefone,origem\nMaria,11999998888`;
    assert.throws(
      () => parseCsv(csvContent),
      /Linha 2: Número de colunas \(2\) diverge do cabeçalho \(3\)/
    );
  });

  await t.test("Validação de Data Civil Real no Calendário Gregoriano", () => {
    assert.equal(isValidCivilDate("2026-02-28"), true);
    assert.equal(isValidCivilDate("2024-02-29"), true); // Bissexto
    assert.equal(isValidCivilDate("2026-02-31"), false); // Inexistente!
    assert.equal(isValidCivilDate("2026-13-10"), false); // Mês 13!
    assert.equal(isValidCivilDate("invalid-date"), false);
  });

  await t.test("Validação de UUID RFC 4122 para IDs de Conta", () => {
    assert.equal(isValidUuid("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"), true);
    assert.equal(isValidUuid("12345"), false);
    assert.equal(isValidUuid("not-a-uuid"), false);
  });

  await t.test("Preservação de fórmulas (Formula Injection) durante a importação", () => {
    const row = {
      nome: "=SUM(1+1)",
      telefone: "11988885555",
      origem: "instagram",
      status: "new_lead",
      observacoes: "@cmd.exe",
    };
    const res = validatePatientCsvRow(row, 2);
    assert.equal(res.valid, true);
    assert.equal(res.data?.name, "=SUM(1+1)"); // Mantém valor bruto intacto!
    assert.equal(res.data?.notes, "@cmd.exe");
  });

  await t.test("Hash canônico versionado diferencia entidades e versões de parser", () => {
    const content = "nome,telefone\nMaria,11999998888";
    const hashPatient = calculateVersionedCsvHash("patient", content, "v2");
    const hashFinancial = calculateVersionedCsvHash("financial", content, "v2");
    const hashV1 = calculateVersionedCsvHash("patient", content, "v1");

    assert.notEqual(hashPatient, hashFinancial);
    assert.notEqual(hashPatient, hashV1);
    assert.equal(hashPatient, calculateVersionedCsvHash("patient", content, "v2"));
  });
});
