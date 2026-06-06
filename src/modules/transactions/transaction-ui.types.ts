import type { Transaction } from '@/modules/transactions/transaction.types';

export type TransactionListRow =
  | {
      kind: 'date';
      key: string;
      date: string;
      income: number;
      expense: number;
      currency: Transaction['currency'];
    }
  | { kind: 'item'; key: string; transaction: Transaction };
