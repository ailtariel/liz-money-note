import type { CurrencyCode } from '@/modules/shared/money';
import type { TransactionType } from '@/modules/transactions/transaction.types';

export interface ImportTextFile {
  fileName: string;
  content: string;
  currency?: CurrencyCode;
}

export interface ParsedImportTransaction {
  rowNumber: number;
  occurredAt: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
}

export interface ImportParseIssue {
  rowNumber: number;
  message: string;
  raw: string;
}

export interface ParsedImportFile {
  fileName: string;
  bookName: string;
  accountName: string;
  currency: CurrencyCode;
  transactions: ParsedImportTransaction[];
  issues: ImportParseIssue[];
  skippedRows: number;
}

export interface ImportFileResult {
  fileName: string;
  bookName: string;
  accountName: string;
  currency: CurrencyCode;
  importedRows: number;
  skippedRows: number;
  issueCount: number;
  issues: ImportParseIssue[];
}

export interface ImportBatchResult {
  files: ImportFileResult[];
  importedRows: number;
  skippedRows: number;
  issueCount: number;
}
