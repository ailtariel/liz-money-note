import type {
  ImportParseIssue,
  ImportTextFile,
  ParsedImportFile,
  ParsedImportTransaction
} from './import.types';
import type { CurrencyCode } from '@/modules/shared/money';
import type { TransactionType } from '@/modules/transactions/transaction.types';

interface HeaderIndexes {
  date: number;
  type: number;
  amount: number;
  category: number;
  note: number;
}

const headerAliases = {
  date: ['日期', 'date', 'time', '发生时间'],
  type: ['收支类型', '类型', 'type'],
  amount: ['金额', 'amount'],
  category: ['分类', 'category', 'tag'],
  note: ['备注', 'note', 'memo']
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}

export function inferCurrencyFromFileName(fileName: string): CurrencyCode {
  return fileName.includes('国内') ? 'CNY' : 'AED';
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function splitTextLine(line: string, delimiter: 'csv' | 'tab' | 'space') {
  if (delimiter === 'csv') {
    return splitCsvLine(line);
  }

  if (delimiter === 'tab') {
    return line.split('\t').map((value) => value.trim());
  }

  return line.trim().split(/\s{2,}/).map((value) => value.trim());
}

function detectDelimiter(headerLine: string): 'csv' | 'tab' | 'space' {
  if (headerLine.includes(',')) {
    return 'csv';
  }

  if (headerLine.includes('\t')) {
    return 'tab';
  }

  return 'space';
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) =>
    aliases.includes(normalizeHeader(header))
  );
}

function getHeaderIndexes(headers: string[]): HeaderIndexes | null {
  const date = findHeaderIndex(headers, headerAliases.date);
  const type = findHeaderIndex(headers, headerAliases.type);
  const amount = findHeaderIndex(headers, headerAliases.amount);
  const category = findHeaderIndex(headers, headerAliases.category);
  const note = findHeaderIndex(headers, headerAliases.note);

  if (date < 0 || type < 0 || amount < 0) {
    return null;
  }

  return {
    date,
    type,
    amount,
    category,
    note
  };
}

function normalizeDate(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    return trimmed.replace(/\s+/, 'T');
  }

  throw new Error('日期格式不支持。');
}

function normalizeType(value: string): TransactionType {
  const normalized = value.trim().toLowerCase();

  if (['收入', 'income', 'in'].includes(normalized)) {
    return 'income';
  }

  if (['支出', 'expense', 'out'].includes(normalized)) {
    return 'expense';
  }

  throw new Error('收支类型必须是收入或支出。');
}

function parseAmountToMinorUnits(value: string) {
  const normalized = value
    .replace(/^"+|"+$/g, '')
    .replace(/[,+\s]/g, '')
    .trim();
  const unsigned = normalized.startsWith('-')
    ? normalized.slice(1)
    : normalized;

  if (!/^\d+(\.\d{1,2})?$/.test(unsigned)) {
    throw new Error('金额格式不支持。');
  }

  const [major, minor = ''] = unsigned.split('.');
  return Number(major) * 100 + Number(minor.padEnd(2, '0'));
}

function isSummaryRow(values: string[]) {
  return values.some((value) => value.trim() === '合计');
}

function parseRow(
  values: string[],
  rowNumber: number,
  indexes: HeaderIndexes
): ParsedImportTransaction {
  const type = normalizeType(values[indexes.type] ?? '');

  return {
    rowNumber,
    occurredAt: normalizeDate(values[indexes.date] ?? ''),
    type,
    amount: parseAmountToMinorUnits(values[indexes.amount] ?? ''),
    category:
      indexes.category >= 0 && values[indexes.category]
        ? values[indexes.category].trim()
        : '未分类',
    note:
      indexes.note >= 0 && values[indexes.note]?.trim()
        ? values[indexes.note].trim()
        : null
  };
}

export function parseTextImportFile(file: ImportTextFile): ParsedImportFile {
  const bookName = stripExtension(file.fileName);
  const delimiter = detectDelimiter(file.content.split(/\r?\n/)[0] ?? '');
  const lines = file.content.split(/\r?\n/);
  const issues: ImportParseIssue[] = [];
  const transactions: ParsedImportTransaction[] = [];
  let skippedRows = 0;

  const headerLineIndex = lines.findIndex((line) => line.trim().length > 0);
  if (headerLineIndex < 0) {
    throw new Error(`${file.fileName} 是空文件。`);
  }

  const headers = splitTextLine(lines[headerLineIndex], delimiter);
  const indexes = getHeaderIndexes(headers) ?? {
    date: 0,
    type: 1,
    amount: 2,
    category: 3,
    note: 4
  };

  for (let index = headerLineIndex + 1; index < lines.length; index += 1) {
    const raw = lines[index];
    const rowNumber = index + 1;

    if (!raw.trim()) {
      skippedRows += 1;
      continue;
    }

    const values = splitTextLine(raw, delimiter);
    if (isSummaryRow(values)) {
      skippedRows += 1;
      continue;
    }

    try {
      transactions.push(parseRow(values, rowNumber, indexes));
    } catch (error) {
      skippedRows += 1;
      issues.push({
        rowNumber,
        raw,
        message: error instanceof Error ? error.message : '导入行解析失败。'
      });
    }
  }

  return {
    fileName: file.fileName,
    bookName,
    accountName: `${bookName} 导入账户`,
    currency: file.currency ?? inferCurrencyFromFileName(file.fileName),
    transactions,
    issues,
    skippedRows
  };
}
