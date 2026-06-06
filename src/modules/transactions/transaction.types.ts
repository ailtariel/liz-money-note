import type { CurrencyCode } from '@/modules/shared/money';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: number;
  bookId: number;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  accountId: number;
  targetAccountId: number | null;
  occurredAt: string;
  note: string | null;
  recurringEventId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tagIds: number[];
}

export interface TransactionInput {
  bookId: number;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  accountId: number;
  targetAccountId?: number | null;
  occurredAt: string;
  note?: string | null;
  tagIds?: number[];
  recurringEventId?: number | null;
}

export interface TransactionFilters {
  bookId?: number | null;
  accountId?: number | null;
  type?: TransactionType | null;
  tagId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}
