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
};

/**
 * Calcula o hash SHA-256 do conteúdo bruto do arquivo CSV para garantir idempotência.
 */
export function calculateCsvHash(content: string): string {
  return createHash("sha256").update(content.trim()).digest("hex");
}

/**
 * Previne injeção de fórmulas (CSV Injection / Formula Injection) ao exportar ou processar células.
 * Prefixando com apóstrofo se a string iniciar com caracteres executáveis em planilhas.
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
 * Parser de CSV compatível com RFC 4180 (suporta campos multilinha entre aspas, remoção de BOM e delimitadores vírgula/ponto-e-vírgula).
 */
export function parseCsv(content: string): ParsedCsv {
  if (!content || typeof content !== "string") {
    return { headers: [], rows: [] };
  }

  // Remove UTF-8 BOM se presente
  let cleanContent = content.startsWith("\uFEFF") ? content.slice(1) : content;
  if (!cleanContent.trim()) {
    return { headers: [], rows: [] };
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
        currentRecord.push(sanitizeCsvCell(currentField));
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++; // CRLF
        currentRecord.push(sanitizeCsvCell(currentField));
        currentField = "";
        if (currentRecord.some((f) => f.trim().length > 0)) {
          records.push(currentRecord);
        }
        currentRecord = [];
      } else if (char === "\n") {
        currentRecord.push(sanitizeCsvCell(currentField));
        currentField = "";
        if (currentRecord.some((f) => f.trim().length > 0)) {
          records.push(currentRecord);
        }
        currentRecord = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(sanitizeCsvCell(currentField));
    if (currentRecord.some((f) => f.trim().length > 0)) {
      records.push(currentRecord);
    }
  }

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = records[0];
  const headers = rawHeaders.map((h) => h.toLowerCase().trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < records.length; i++) {
    const values = records[i];
    const rowObj: Record<string, string> = {};
    for (let h = 0; h < headers.length; h++) {
      rowObj[headers[h]] = values[h] ?? "";
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}


/**
 * Valida os campos de uma linha de CSV destinada ao cadastro de paciente.
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

  if (!validPatientName(name)) {
    return { valid: false, error: `Linha ${rowNumber}: Nome do paciente é inválido ou ausente.` };
  }
  if (!validPatientPhone(phone)) {
    return { valid: false, error: `Linha ${rowNumber}: Telefone celular de 11 dígitos com DDD é obrigatório.` };
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
      birthDate: row.datanascimento || row.birthdate || undefined,
      guardianName: row.responsavel || row.guardianname || undefined,
      contactSource: source,
      status,
      notes: row.observacoes || row.notes || undefined,
      careAlert: row.alerta || row.carealert || undefined,
    },
  };
}

/**
 * Valida os campos de uma linha de CSV destinada a lançamentos financeiros.
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
  const paidAt = (row.datapagamento || row.paidat || "").trim() || undefined;

  if (!companyAccountId) {
    return { valid: false, error: `Linha ${rowNumber}: ID da conta/caixa é obrigatório.` };
  }
  if (!isOneOf(entryType, ENTRY_TYPES)) {
    return { valid: false, error: `Linha ${rowNumber}: Tipo '${entryType}' é inválido. Opções: ${ENTRY_TYPES.join(", ")}.` };
  }

  const amountCents = Number(rawAmount);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { valid: false, error: `Linha ${rowNumber}: Valor em centavos (${rawAmount}) deve ser um número inteiro positivo.` };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return { valid: false, error: `Linha ${rowNumber}: Data de vencimento '${dueDate}' deve estar no formato AAAA-MM-DD.` };
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
      paidAt,
    },
  };
}
