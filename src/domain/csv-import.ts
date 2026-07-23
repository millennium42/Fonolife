import { createHash } from "node:crypto";
import {
  CONTACT_SOURCES,
  isOneOf,
  normalizePhone,
  PATIENT_STATUSES,
  validPatientName,
  validPatientPhone,
} from "./patients.js";
import {
  ENTRY_TYPES,
  FINANCE_CATEGORIES,
} from "./finance.js";
import { PAYMENT_METHODS } from "./sales.js";

export type CsvPatientRow = {
  name: string;
  phone: string;
  birthDate?: string;
  guardianName?: string;
  contactSource: string;
  status: string;
  notes?: string;
  careAlert?: string;
};

export type CsvFinancialRow = {
  companyAccountId: string;
  entryType: "income" | "expense";
  amountCents: number;
  dueDate: string;
  description: string;
  category: string;
  paymentMethod: string;
  paidAt?: string;
};

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
  totalRowsCount: number;
};

/**
  Calcula o hash canônico versionado do conteúdo do arquivo CSV para garantia de idempotência.
  Incorpora o tipo de entidade e a versão do parser no hash para evitar colisões entre esquemas.
 */
export function calculateVersionedCsvHash(entityType: string, content: string, version = "v2"): string {
  const normalized = (content || "").trim();
  return createHash("sha256")
    .update(`${entityType}:${version}:${normalized}`)
    .digest("hex");
}

/**
  Compatibilidade legada para cálculo de hash simples de CSV.
 */
export function calculateCsvHash(content: string): string {
  return calculateVersionedCsvHash("generic", content, "v1");
}

/**
  Sanitiza células para prevenir injeção de fórmulas (CSV / Formula Injection).
  Importante: Utilizado EXCLUSIVAMENTE para exportação de dados destinados a planilhas.
 */
export function sanitizeCsvCell(value: string): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
  Valida se uma data no formato AAAA-MM-DD é uma data civil real no calendário gregoriano
  (rejeitando datas inexistentes como 31 de fevereiro ou mês 13).
 */
export function isValidCivilDate(dateStr?: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  const [year, month, day] = trimmed.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
  Valida se uma string é um UUID válido segundo a especificação RFC 4122.
 */
export function isValidUuid(uuidStr?: string): boolean {
  if (!uuidStr || typeof uuidStr !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuidStr.trim());
}

/**
  Parser estrito de CSV compatível com RFC 4180.
  Suporta campos multilinha entre aspas, remoção de BOM UTF-8, delimitadores vírgula e ponto-e-virgula.
  Valida aspas não balanceadas, ausência/duplicidade de cabeçalhos e divergência no número de colunas por linha.
 */
export function parseCsv(
  content: string,
  options?: { requiredHeaders?: string[]; maxRows?: number }
): ParsedCsv {
  if (!content || typeof content !== "string") {
    return { headers: [], rows: [], totalRowsCount: 0 };
  }

  // Remove UTF-8 BOM se presente
  let cleanContent = content.startsWith("\uFEFF") ? content.slice(1) : content;
  if (!cleanContent.trim()) {
    return { headers: [], rows: [], totalRowsCount: 0 };
  }

  // Detecta o delimitador observando a primeira linha fora de aspas
  let delimiter = ",";
  const firstLine = cleanContent.split(/[\r\n]+/)[0] || "";
  let semicolons = 0;
  let commas = 0;
  let inQ = false;
  for (let i = 0; i < firstLine.length; i++) {
    if (firstLine[i] === '"') inQ = !inQ;
    else if (!inQ) {
      if (firstLine[i] === ";") semicolons++;
      if (firstLine[i] === ",") commas++;
    }
  }
  if (semicolons > commas) delimiter = ";";

  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    const nextChar = cleanContent[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // ignora aspas duplas escapadas ("")
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRecord.push(currentField);
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++; // CRLF
        currentRecord.push(currentField);
        currentField = "";
        records.push(currentRecord);
        currentRecord = [];
      } else if (char === "\n") {
        currentRecord.push(currentField);
        currentField = "";
        records.push(currentRecord);
        currentRecord = [];
      } else {
        currentField += char;
      }
    }
  }

  if (inQuotes) {
    throw new Error("Aspas não balanceadas ou malformatadas no arquivo CSV");
  }

  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField);
    records.push(currentRecord);
  }

  // Remove linhas totalmente vazias do final
  while (records.length > 0 && records[records.length - 1].every((f) => f.trim().length === 0)) {
    records.pop();
  }

  if (records.length === 0) {
    return { headers: [], rows: [], totalRowsCount: 0 };
  }

  const rawHeaders = records[0];
  const headers = rawHeaders.map((h) => h.toLowerCase().trim());

  // Valida se há cabeçalhos duplicados
  const headerSet = new Set<string>();
  for (const h of headers) {
    if (headerSet.has(h)) {
      throw new Error(`Cabeçalhos duplicados não permitidos no CSV: '${h}'`);
    }
    headerSet.add(h);
  }

  // Valida cabeçalhos obrigatórios se especificados
  if (options?.requiredHeaders) {
    for (const req of options.requiredHeaders) {
      if (!headers.includes(req.toLowerCase().trim())) {
        throw new Error(`Cabeçalho obrigatório ausente no CSV: '${req}'`);
      }
    }
  }

  const maxAllowedRows = options?.maxRows ?? 10_000;
  const dataRecords = records.slice(1);
  if (dataRecords.length > maxAllowedRows) {
    throw new Error(`O arquivo CSV excede o limite máximo de ${maxAllowedRows} linhas por importação`);
  }

  const rows: Record<string, string>[] = [];
  for (let i = 0; i < dataRecords.length; i++) {
    const values = dataRecords[i];
    const rowNum = i + 2;

    // Ignora linha vazia no meio
    if (values.every((v) => v.trim().length === 0)) {
      continue;
    }

    if (values.length !== headers.length) {
      throw new Error(`Linha ${rowNum}: Número de colunas (${values.length}) diverge do cabeçalho (${headers.length})`);
    }

    const rowObj: Record<string, string> = {};
    for (let h = 0; h < headers.length; h++) {
      rowObj[headers[h]] = values[h];
    }
    rows.push(rowObj);
  }

  return { headers, rows, totalRowsCount: rows.length };
}

/**
  Valida os campos de uma linha de CSV destinada ao cadastro de paciente.
  Preserva fórmulas no campo de valor (para prevencao de perda de dados).
 */
export function validatePatientCsvRow(
  row: Record<string, string>,
  rowNumber: number
): { valid: boolean; data?: CsvPatientRow; error?: string } {
  const name = (row.nome || row.name || "").trim();
  const rawPhone = row.telefone || row.phone || "";
  const phone = normalizePhone(rawPhone);
  const source = (row.origem || row.source || row.contactsource || "other").trim().toLowerCase();
  const status = (row.status || row.journeystatus || "new_lead").trim().toLowerCase();
  const birthDate = (row.datanascimento || row.birthdate || "").trim();

  if (!validPatientName(name)) {
    return { valid: false, error: `Linha ${rowNumber}: Nome do paciente é inválido ou ausente.` };
  }
  if (!validPatientPhone(phone)) {
    return { valid: false, error: `Linha ${rowNumber}: Telefone celular de 11 dígitos com DDD é obrigatório.` };
  }
  if (birthDate && !isValidCivilDate(birthDate)) {
    return { valid: false, error: `Linha ${rowNumber}: Data civil de nascimento '${birthDate}' é inválida ou inexistente.` };
  }
  if (!isOneOf(source, CONTACT_SOURCES)) {
    return { valid: false, error: `Linha ${rowNumber}: Origem '${source}' é inválida. Opções: ${CONTACT_SOURCES.join(", ")}.` };
  }
  if (!isOneOf(status, PATIENT_STATUSES)) {
    return { valid: false, error: `Linha ${rowNumber}: Status '${status}' é inválido. Opções: ${PATIENT_STATUSES.join(", ")}.` };
  }

  return {
    valid: true,
    data: {
      name,
      phone,
      birthDate: birthDate || undefined,
      guardianName: row.responsavel || row.guardianname || undefined,
      contactSource: source,
      status,
      notes: row.observacoes || row.notes || undefined,
      careAlert: row.alerta || row.carealert || undefined,
    },
  };
}

/**
  Valida os campos de uma linha de CSV destinada a lançamentos financeiros.
  Executa validação estrita de UUID RFC 4122 para a conta e checagem de data civil real.
 */
export function validateFinancialCsvRow(
  row: Record<string, string>,
  rowNumber: number
): { valid: boolean; data?: CsvFinancialRow; error?: string } {
  const companyAccountId = (row.contaid || row.companyaccountid || "").trim();
  const entryType = (row.tipo || row.entrytype || "").trim().toLowerCase();
  const rawAmount = (row.valorcentavos || row.amountcents || row.valor || "").trim();
  const dueDate = (row.datavencimento || row.duedate || "").trim();
  const description = (row.descricao || row.description || "").trim();
  const category = (row.categoria || row.category || "").trim().toLowerCase();
  const paymentMethod = (row.formapagamento || row.paymentmethod || "").trim().toLowerCase();
  const paidAt = (row.datapagamento || row.paidat || "").trim();

  if (!isValidUuid(companyAccountId)) {
    return { valid: false, error: `Linha ${rowNumber}: ID da conta/caixa ('${companyAccountId}') deve ser um UUID RFC 4122 válido.` };
  }
  if (!isOneOf(entryType, ENTRY_TYPES)) {
    return { valid: false, error: `Linha ${rowNumber}: Tipo '${entryType}' é inválido. Opções: ${ENTRY_TYPES.join(", ")}.` };
  }

  const amountCents = Number(rawAmount);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { valid: false, error: `Linha ${rowNumber}: Valor em centavos (${rawAmount}) deve ser um número inteiro positivo.` };
  }

  if (!isValidCivilDate(dueDate)) {
    return { valid: false, error: `Linha ${rowNumber}: Data civil de vencimento '${dueDate}' é inválida ou inexistente.` };
  }

  if (paidAt && !isValidCivilDate(paidAt)) {
    return { valid: false, error: `Linha ${rowNumber}: Data civil de pagamento '${paidAt}' é inválida ou inexistente.` };
  }

  if (!description || description.length < 2) {
    return { valid: false, error: `Linha ${rowNumber}: Descrição com ao menos 2 caracteres é obrigatória.` };
  }

  if (!isOneOf(category, FINANCE_CATEGORIES)) {
    return { valid: false, error: `Linha ${rowNumber}: Categoria '${category}' é inválida.` };
  }

  if (!isOneOf(paymentMethod, PAYMENT_METHODS)) {
    return { valid: false, error: `Linha ${rowNumber}: Forma de pagamento '${paymentMethod}' é inválida.` };
  }

  return {
    valid: true,
    data: {
      companyAccountId,
      entryType: entryType as "income" | "expense",
      amountCents,
      dueDate,
      description,
      category,
      paymentMethod,
      paidAt: paidAt || undefined,
    },
  };
}
