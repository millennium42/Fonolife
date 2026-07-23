import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateVersionedCsvHash,
  parseCsv,
  sanitizeCsvCell,
  validateFinancialCsvRow,
  validatePatientCsvRow,
} from "../src/domain/csv-import.js";

test("calcula hash SHA-256 de conteúdo CSV para idempotência versionada", () => {
  const content = "nome,telefone\nJoão Silva,11999998888";
  const hash1 = calculateVersionedCsvHash("patient", content);
  const hash2 = calculateVersionedCsvHash("patient", content + "\n  ");
  assert.equal(typeof hash1, "string");
  assert.equal(hash1.length, 64);
  assert.equal(hash1, hash2, "Espaços vazios no final não alteram a idempotência do hash");
});

test("sanitiza células para prevenir injeção de fórmulas (somente em exportações)", () => {
  assert.equal(sanitizeCsvCell("=SUM(1+1)"), "'=SUM(1+1)");
  assert.equal(sanitizeCsvCell("+12345"), "'+12345");
  assert.equal(sanitizeCsvCell("-100"), "'-100");
  assert.equal(sanitizeCsvCell("@cmd"), "'@cmd");
  assert.equal(sanitizeCsvCell("Maria Santos"), "Maria Santos");
});

test("faz parser de CSV delimitado por vírgula ou ponto e vírgula", () => {
  const csvComma = "nome,telefone,origem\nMaria,11988887777,instagram";
  const parsedComma = parseCsv(csvComma);
  assert.deepEqual(parsedComma.headers, ["nome", "telefone", "origem"]);
  assert.equal(parsedComma.rows.length, 1);
  assert.equal(parsedComma.rows[0].nome, "Maria");
  assert.equal(parsedComma.rows[0].telefone, "11988887777");

  const csvSemicolon = "nome;telefone;origem\nCarlos;11977776666;google";
  const parsedSemicolon = parseCsv(csvSemicolon);
  assert.equal(parsedSemicolon.rows[0].nome, "Carlos");
});

test("valida linha de paciente em CSV", () => {
  const validRow = { nome: "Ana Paula", telefone: "(11) 98888-5555", origem: "instagram", status: "new_lead" };
  const validRes = validatePatientCsvRow(validRow, 2);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.data?.name, "Ana Paula");
  assert.equal(validRes.data?.phone, "11988885555");

  const invalidRow = { nome: "", telefone: "123" };
  const invalidRes = validatePatientCsvRow(invalidRow, 3);
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.error?.includes("Linha 3"));
});

test("valida linha de lançamento financeiro em CSV com centavos inteiros e UUID", () => {
  const validRow = {
    contaid: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    tipo: "income",
    valorcentavos: "15000",
    datavencimento: "2026-08-10",
    descricao: "Consulta Audiológica",
    categoria: "service",
    formapagamento: "pix",
  };
  const res = validateFinancialCsvRow(validRow, 2);
  assert.equal(res.valid, true);
  assert.equal(res.data?.amountCents, 15000);

  const invalidRow = {
    contaid: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    tipo: "income",
    valorcentavos: "150.50", // Não é inteiro!
    datavencimento: "2026-08-10",
    descricao: "Teste",
    categoria: "service",
    formapagamento: "pix",
  };
  const invRes = validateFinancialCsvRow(invalidRow, 3);
  assert.equal(invRes.valid, false);
  assert.ok(invRes.error?.includes("centavos"));
});
