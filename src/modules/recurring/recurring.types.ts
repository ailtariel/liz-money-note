import type { CurrencyCode } from '@/modules/shared/money';
import type { TransactionType } from '@/modules/transactions/transaction.types';

export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringEvent {
  id: number;
  bookId: number;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  accountId: number;
  targetAccountId: number | null;
  note: string | null;
  repeatType: RepeatType;
  repeatInterval: number;
  startDate: string;
  endDate: string | null;
  nextTriggerDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tagIds: number[];
}

export interface RecurringEventInput {
  bookId: number;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  accountId: number;
  targetAccountId?: number | null;
  note?: string | null;
  repeatType: RepeatType;
  repeatInterval: number;
  startDate: string;
  endDate?: string | null;
  nextTriggerDate: string;
  tagIds?: number[];
}
